package com.emart.repository;

import com.emart.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop30ByRecipientUserIdOrderByCreatedAtDesc(Long recipientUserId);

    long countByRecipientUserIdAndIsReadFalse(Long recipientUserId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.recipientUserId = :uid AND n.isRead = false")
    int markAllRead(@Param("uid") Long uid);
}
