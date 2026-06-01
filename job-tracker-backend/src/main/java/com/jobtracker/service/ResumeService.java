package com.jobtracker.service;

import com.jobtracker.entity.mysql.Resume;
import com.jobtracker.repository.mysql.ResumeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "application/pdf", "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    private static final long MAX_SIZE = 10L * 1024 * 1024;
    private static final Map<String, String> EXT_MAP = Map.of(
            "application/pdf", "pdf",
            "application/msword", "doc",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"
    );

    private final ResumeRepository resumeRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public List<Resume> getResumes(String userId) {
        return resumeRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Resume uploadResume(String userId, String name, MultipartFile file) throws IOException {
        if (!ALLOWED_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("仅支持 PDF、DOC、DOCX 格式");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new IllegalArgumentException("文件不能超过 10MB");
        }

        Path userDir = Paths.get(uploadDir, userId);
        Files.createDirectories(userDir);

        String safeBase = name.replaceAll("[^a-zA-Z0-9\\u4e00-\\u9fa5_-]", "_");
        String ext = EXT_MAP.getOrDefault(file.getContentType(), "bin");
        String filename = safeBase + "_" + System.currentTimeMillis() + "." + ext;
        Path filePath = userDir.resolve(filename);
        Files.write(filePath, file.getBytes());

        Resume resume = Resume.builder()
                .userId(userId)
                .name(name)
                .filename(file.getOriginalFilename())
                .filePath(filePath.toAbsolutePath().toString())
                .mimeType(file.getContentType())
                .size(file.getSize())
                .build();
        return resumeRepository.save(resume);
    }

    public Resume getResumeMetadata(String userId, String id) {
        return resumeRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("简历不存在"));
    }

    public byte[] getResumeBytes(String userId, String id) throws IOException {
        Resume resume = getResumeMetadata(userId, id);
        return Files.readAllBytes(Paths.get(resume.getFilePath()));
    }

    public void deleteResume(String userId, String id) throws IOException {
        Resume resume = getResumeMetadata(userId, id);
        resumeRepository.delete(resume);
        try {
            Files.deleteIfExists(Paths.get(resume.getFilePath()));
        } catch (IOException ignored) {}
    }
}
