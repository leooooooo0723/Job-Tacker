package com.jobtracker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class JobTrackerApplication {
    public static void main(String[] args) {
        System.setProperty("java.net.useSystemProxies", "false");
        SpringApplication.run(JobTrackerApplication.class, args);
    }
}
