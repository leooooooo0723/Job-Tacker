package com.jobtracker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.*;
import com.jobtracker.entity.mysql.Application;
import com.jobtracker.entity.mysql.ChatMessage;
import com.jobtracker.entity.mysql.Event;
import com.jobtracker.repository.mysql.ApplicationRepository;
import com.jobtracker.repository.mysql.ChatMessageRepository;
import com.jobtracker.repository.mysql.CompanyRepository;
import com.jobtracker.repository.mysql.EventRepository;
import com.jobtracker.repository.mysql.JobCycleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ApplicationRepository applicationRepository;
    private final EventRepository eventRepository;
    private final CompanyRepository companyRepository;
    private final JobCycleRepository jobCycleRepository;
    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${deepseek.api-key}")
    private String apiKey;

    @Value("${deepseek.model}")
    private String model;

    public List<ChatMessage> getHistory(String userId) {
        return chatMessageRepository.findByUserIdOrderByCreatedAtAsc(userId);
    }

    public void clearHistory(String userId) {
        chatMessageRepository.deleteByUserId(userId);
    }

    public String chat(String userId, String username, String message) throws IOException {
        chatMessageRepository.save(ChatMessage.builder()
                .userId(userId).role("user").content(message).build());

        List<ChatMessage> history = chatMessageRepository.findByUserIdOrderByCreatedAtAsc(userId);

        ArrayNode messages = objectMapper.createArrayNode();

        // DeepSeek/OpenAI 格式：system 作为第一条消息
        ObjectNode systemMsg = objectMapper.createObjectNode();
        systemMsg.put("role", "system");
        systemMsg.put("content", String.format(
                "你是 %s 的求职管理助手（OfferOS）。帮助用户查询今日安排、统计投递情况、添加面试记录、更新状态。今天是 %s。回答简洁，直接给出信息，不要多余的寒暄。",
                username, LocalDate.now().toString()));
        messages.add(systemMsg);

        for (ChatMessage m : history) {
            ObjectNode msg = objectMapper.createObjectNode();
            msg.put("role", m.getRole());
            msg.put("content", m.getContent());
            messages.add(msg);
        }

        String reply = runAgentLoop(userId, messages, buildTools());

        chatMessageRepository.save(ChatMessage.builder()
                .userId(userId).role("assistant").content(reply).build());
        return reply;
    }

    private String runAgentLoop(String userId, ArrayNode messages, ArrayNode tools) throws IOException {
        JsonNode response = callDeepSeek(messages, tools);
        JsonNode choice = response.path("choices").path(0);
        String finishReason = choice.path("finish_reason").asText();

        while ("tool_calls".equals(finishReason)) {
            JsonNode assistantMessage = choice.path("message");

            // 把 assistant 的 tool_calls 消息加入历史
            ObjectNode assistantMsg = objectMapper.createObjectNode();
            assistantMsg.put("role", "assistant");
            JsonNode contentNode = assistantMessage.path("content");
            if (contentNode.isNull() || contentNode.isMissingNode()) {
                assistantMsg.putNull("content");
            } else {
                assistantMsg.put("content", contentNode.asText());
            }
            assistantMsg.set("tool_calls", assistantMessage.path("tool_calls"));
            messages.add(assistantMsg);

            // 执行每个工具并把结果追加
            for (JsonNode toolCall : assistantMessage.path("tool_calls")) {
                String toolCallId = toolCall.path("id").asText();
                String toolName = toolCall.path("function").path("name").asText();
                JsonNode arguments;
                try {
                    arguments = objectMapper.readTree(toolCall.path("function").path("arguments").asText());
                } catch (Exception e) {
                    arguments = objectMapper.createObjectNode();
                }

                String result = executeTool(userId, toolName, arguments);

                ObjectNode toolResult = objectMapper.createObjectNode();
                toolResult.put("role", "tool");
                toolResult.put("tool_call_id", toolCallId);
                toolResult.put("content", result);
                messages.add(toolResult);
            }

            response = callDeepSeek(messages, tools);
            choice = response.path("choices").path(0);
            finishReason = choice.path("finish_reason").asText();
        }

        return choice.path("message").path("content").asText("");
    }

    private JsonNode callDeepSeek(ArrayNode messages, ArrayNode tools) throws IOException {
        ObjectNode body = objectMapper.createObjectNode();
        body.put("model", model);
        body.set("messages", messages);
        body.set("tools", tools);
        body.put("tool_choice", "auto");

        Request request = new Request.Builder()
                .url("https://api.deepseek.com/v1/chat/completions")
                .post(RequestBody.create(objectMapper.writeValueAsBytes(body),
                        MediaType.parse("application/json")))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            String responseBody = response.body().string();
            if (!response.isSuccessful()) {
                throw new IOException("DeepSeek API error: " + response.code() + " " + responseBody);
            }
            return objectMapper.readTree(responseBody);
        }
    }

    private String executeTool(String userId, String toolName, JsonNode input) {
        try {
            return switch (toolName) {
                case "get_today_schedule" -> getTodaySchedule(userId, input);
                case "get_applications_summary" -> getApplicationsSummary(userId, input);
                case "add_event" -> addEvent(userId, input);
                case "update_application_status" -> updateApplicationStatus(userId, input);
                default -> "未知操作";
            };
        } catch (Exception e) {
            return "操作失败: " + e.getMessage();
        }
    }

    private String getTodaySchedule(String userId, JsonNode input) {
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = LocalDate.now().atTime(23, 59, 59);
        String cycleId = input.path("cycleId").asText(null);

        List<Event> events = (cycleId != null && !cycleId.isEmpty())
                ? eventRepository.findTodayEventsByUserIdAndCycleId(userId, cycleId, start, end)
                : eventRepository.findTodayEventsByUserId(userId, start, end);

        if (events.isEmpty()) return "今天没有安排";

        Map<String, String> typeMap = Map.of("interview", "面试", "written_test", "笔试", "assessment", "测评");
        return events.stream().map(e -> {
            String time = e.getScheduledAt().format(DateTimeFormatter.ofPattern("HH:mm"));
            String type = typeMap.getOrDefault(e.getType(), e.getType());
            String link = (e.getLink() != null && !e.getLink().isEmpty()) ? " 链接:" + e.getLink() : "";
            return time + " " + type + link;
        }).collect(Collectors.joining("\n"));
    }

    private String getApplicationsSummary(String userId, JsonNode input) {
        String cycleId = input.path("cycleId").asText(null);
        List<Application> apps = (cycleId != null && !cycleId.isEmpty())
                ? applicationRepository.findByUserIdAndCycleId(userId, cycleId)
                : applicationRepository.findByUserId(userId);

        Map<String, Long> byStatus = apps.stream()
                .collect(Collectors.groupingBy(Application::getStatus, Collectors.counting()));
        String lines = byStatus.entrySet().stream()
                .map(e -> e.getKey() + ": " + e.getValue() + "家")
                .collect(Collectors.joining("\n"));
        return "共投递 " + apps.size() + " 个岗位\n" + lines;
    }

    private String addEvent(String userId, JsonNode input) {
        String companyName = input.path("companyName").asText();
        var activeCycle = jobCycleRepository.findByUserIdAndIsActiveTrue(userId).orElse(null);
        if (activeCycle == null) return "没有激活的求职周期，请先创建一个";

        var companies = companyRepository.findByNameContaining(companyName);
        if (companies.isEmpty()) return "找不到公司「" + companyName + "」，请先在公司库中添加";

        var company = companies.get(0);
        var appOpt = applicationRepository
                .findByCompanyIdAndUserIdAndCycleId(company.getId(), userId, activeCycle.getId());
        Application app;
        if (appOpt.isEmpty()) {
            app = applicationRepository.save(
                    Application.builder()
                            .companyId(company.getId()).cycleId(activeCycle.getId())
                            .userId(userId).status("已投递").build()
            );
        } else {
            app = appOpt.get(0);
        }

        Event event = Event.builder()
                .applicationId(app.getId())
                .type(input.path("type").asText())
                .scheduledAt(LocalDateTime.parse(input.path("scheduledAt").asText()))
                .link(input.path("link").asText(""))
                .build();
        eventRepository.save(event);

        Map<String, String> typeMap = Map.of("interview", "面试", "written_test", "笔试", "assessment", "测评");
        return "已为「" + company.getName() + "」添加" + typeMap.getOrDefault(event.getType(), event.getType()) + "安排";
    }

    private String updateApplicationStatus(String userId, JsonNode input) {
        String companyName = input.path("companyName").asText();
        String status = input.path("status").asText();
        String positionName = input.path("positionName").asText(null);
        boolean confirmed = input.path("confirmed").asBoolean(false);

        var companies = companyRepository.findByNameContaining(companyName);
        if (companies.isEmpty()) return "找不到公司「" + companyName + "」，请确认公司名称是否正确";

        var company = companies.get(0);
        var activeCycle = jobCycleRepository.findByUserIdAndIsActiveTrue(userId).orElse(null);

        List<Application> apps = (activeCycle != null)
                ? applicationRepository.findByCompanyIdAndUserIdAndCycleId(company.getId(), userId, activeCycle.getId())
                : applicationRepository.findByCompanyIdAndUserId(company.getId(), userId);

        if (positionName != null && !positionName.isEmpty()) {
            apps = apps.stream().filter(a -> a.getPositionName().contains(positionName)).collect(Collectors.toList());
        }

        if (apps.isEmpty()) return "找不到「" + companyName + "」的投递记录";
        if (apps.size() > 1) {
            final List<Application> finalApps = apps;
            String list = IntStream.range(0, finalApps.size())
                    .mapToObj(i -> (i + 1) + ". " + (finalApps.get(i).getPositionName().isEmpty()
                            ? "（未填写岗位名）" : finalApps.get(i).getPositionName()))
                    .collect(Collectors.joining("\n"));
            return "「" + company.getName() + "」有以下多个投递岗位，请告诉我要修改哪一个：\n" + list;
        }

        Application app = apps.get(0);
        String label = app.getPositionName().isEmpty()
                ? company.getName() : company.getName() + "·" + app.getPositionName();

        if (!confirmed) return "即将把「" + label + "」的状态改为【" + status + "】，请回复「确认」执行";

        app.setStatus(status);
        applicationRepository.save(app);
        return "✓ 已将「" + label + "」状态更新为【" + status + "】";
    }

    private ArrayNode buildTools() {
        try {
            String toolsJson = """
            [
              {
                "type": "function",
                "function": {
                  "name": "get_today_schedule",
                  "description": "获取今日的面试、笔试、测评安排",
                  "parameters": {"type":"object","properties":{"cycleId":{"type":"string","description":"求职周期ID，不填则查询所有"}},"required":[]}
                }
              },
              {
                "type": "function",
                "function": {
                  "name": "get_applications_summary",
                  "description": "获取当前求职周期的投递统计，包含总数和各阶段数量",
                  "parameters": {"type":"object","properties":{"cycleId":{"type":"string","description":"求职周期ID"}},"required":[]}
                }
              },
              {
                "type": "function",
                "function": {
                  "name": "add_event",
                  "description": "为某个投递记录添加面试/笔试/测评安排",
                  "parameters": {"type":"object","properties":{"companyName":{"type":"string"},"type":{"type":"string","enum":["interview","written_test","assessment"]},"scheduledAt":{"type":"string","description":"ISO格式时间，如2024-01-15T14:00:00"},"link":{"type":"string"}},"required":["companyName","type","scheduledAt"]}
                }
              },
              {
                "type": "function",
                "function": {
                  "name": "update_application_status",
                  "description": "更新某个公司岗位的投递状态。先确认再执行。",
                  "parameters": {"type":"object","properties":{"companyName":{"type":"string"},"positionName":{"type":"string"},"status":{"type":"string","enum":["已投递","待测评","已测评","待笔试","已笔试","待AI面试","已AI面试","待一面","已一面","待二面","已二面","待三面","已三面","待HR面","已HR面","offer","三方签约"]},"confirmed":{"type":"boolean"}},"required":["companyName","status"]}
                }
              }
            ]
            """;
            return (ArrayNode) objectMapper.readTree(toolsJson);
        } catch (Exception e) {
            return objectMapper.createArrayNode();
        }
    }
}
