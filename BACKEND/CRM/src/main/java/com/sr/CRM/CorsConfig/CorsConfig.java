package com.sr.CRM.CorsConfig;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("https://crm-lilac-omega.vercel.app") // Next.js frontend
                .allowedMethods("*")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}