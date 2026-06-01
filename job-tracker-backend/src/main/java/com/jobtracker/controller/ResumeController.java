package com.jobtracker.controller;

import com.jobtracker.entity.mysql.Resume;
import com.jobtracker.security.AuthUser;
import com.jobtracker.service.ResumeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @GetMapping
    public List<Resume> getResumes(@AuthenticationPrincipal AuthUser user) {
        return resumeService.getResumes(user.getUserId());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadResume(@AuthenticationPrincipal AuthUser user,
                                           @RequestParam("name") String name,
                                           @RequestParam("file") MultipartFile file) {
        try {
            Resume resume = resumeService.uploadResume(user.getUserId(), name, file);
            return ResponseEntity.status(201).body(resume);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            log.error("简历文件写入失败", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "上传失败: " + e.getMessage()));
        } catch (Exception e) {
            log.error("简历上传异常", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "上传失败: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> downloadResume(@AuthenticationPrincipal AuthUser user,
                                                  @PathVariable String id) {
        try {
            Resume resume = resumeService.getResumeMetadata(user.getUserId(), id);
            byte[] bytes = resumeService.getResumeBytes(user.getUserId(), id);

            String asciiName = resume.getName().replaceAll("[^\\x20-\\x7E]", "_");
            String encodedName = URLEncoder.encode(resume.getName(), StandardCharsets.UTF_8);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(resume.getMimeType()));
            headers.set(HttpHeaders.CONTENT_DISPOSITION,
                    "inline; filename=\"" + asciiName + "\"; filename*=UTF-8''" + encodedName);
            headers.setContentLength(bytes.length);

            return ResponseEntity.ok().headers(headers).body(bytes);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteResume(@AuthenticationPrincipal AuthUser user,
                                           @PathVariable String id) {
        try {
            resumeService.deleteResume(user.getUserId(), id);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.ok(Map.of("ok", true));
        }
    }
}
