package com.bill;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class MyClassMateBeApplication {

    public static void main(String[] args) {
        SpringApplication.run(MyClassMateBeApplication.class, args);
    }

}
