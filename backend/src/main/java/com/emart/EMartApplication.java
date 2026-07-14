package com.emart;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync // enables @Async notification sending (P4-NOTI-01)
public class EMartApplication {
    public static void main(String[] args) {
        SpringApplication.run(EMartApplication.class, args);
    }
}
