package com.ths.onlinefood;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling 
public class OnlineFoodApplication {

	public static void main(String[] args) {
		SpringApplication.run(OnlineFoodApplication.class, args);
	}
}
