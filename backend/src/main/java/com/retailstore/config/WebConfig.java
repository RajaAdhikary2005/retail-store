package com.retailstore.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS is now handled by SecurityConfig.corsConfigurationSource()
 * This class is kept for any future non-CORS MVC customizations.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
    // CORS moved to SecurityConfig to fix preflight issue
}
