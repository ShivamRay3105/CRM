package com.sr.CRM.Model;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Sender of the message
    @ManyToOne
    @JoinColumn(name = "sender_id")
    private Users sender;

    // Receiver of the message
    @ManyToOne
    @JoinColumn(name = "receiver_id")
    private Users receiver;

    private String content;

    private LocalDateTime timestamp;

    @Override
    public String toString() {
        return "Message [id=" + id + ", sender=" + sender.getName() +
               ", receiver=" + receiver.getName() + ", content=" + content +
               ", timestamp=" + timestamp + "]";
    }
    
}
