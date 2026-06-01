package com.jobtracker.repository.mysql;

import com.jobtracker.entity.mysql.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByUserIdOrderByCreatedAtAsc(String userId);
    void deleteByUserId(String userId);
}
