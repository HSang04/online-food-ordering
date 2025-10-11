package com.ths.onlinefood.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;
import org.springframework.http.HttpMethod;

@Configuration
public class AppConfig {

   @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(authz -> authz
              
                .requestMatchers("/auth/signup", "/auth/login").permitAll()
                .requestMatchers("/auth/signup-by-admin").hasAnyAuthority("ADMIN", "QUANLY")
                .requestMatchers("/api/admin/**").hasAnyAuthority("ADMIN", "QUANLY")
                .requestMatchers("/api/nguoi-dung/secure/**").authenticated()
                    
                .requestMatchers(HttpMethod.POST, "/api/nguoi-dung").permitAll() 
                .requestMatchers(HttpMethod.GET, "/api/nguoi-dung/**").authenticated()
                    
                .requestMatchers(HttpMethod.GET,"/api/danh-muc","/api/mon-an").permitAll()
                .requestMatchers(HttpMethod.GET,"/api/danh-muc/**","/api/mon-an/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/danh-gia-mon-an/mon-an/*/thong-ke").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/danh-gia-mon-an/mon-an/*/nguoi-dung/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/danh-gia-mon-an/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/danh-gia-mon-an/**").authenticated() 
                .requestMatchers(HttpMethod.PUT, "/api/danh-gia-mon-an/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/danh-gia-mon-an/**").authenticated() 
                
                    
                .requestMatchers(HttpMethod.GET, "/api/hinh-anh-mon-an/**").permitAll()
                    
                .requestMatchers("/api/nguoi-dung/**").hasAnyAuthority("ADMIN", "QUANLY")
                .requestMatchers("/api/gio-hang/**").hasAnyAuthority("KHACHHANG")
                .requestMatchers("/api/danh-gia-mon-an/**").authenticated() 
                .requestMatchers("/api/tin-nhan/**").hasAnyAuthority("ADMIN", "QUANLY", "NHANVIEN_QUANLYDONHANG", "NHANVIEN_QUANLYMONAN", "KHACHHANG")
                .requestMatchers(HttpMethod.GET, "/api/hoa-don/**").hasAnyAuthority("ADMIN", "QUANLY", "NHANVIEN_QUANLYDONHANG", "KHACHHANG")
                .requestMatchers(HttpMethod.GET, "/api/thong-tin-cua-hang/**").permitAll()    
//              .requestMatchers(HttpMethod.POST,"/api/hoa-don/**").hasAnyAuthority("KHACHHANG")
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            .addFilterBefore(new JwtTokenValidator(), BasicAuthenticationFilter.class)
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()));

        return http.build();
    }

    private CorsConfigurationSource corsConfigurationSource() {
        return request -> {
            CorsConfiguration config = new CorsConfiguration();
            config.setAllowedOrigins(Arrays.asList("http://localhost:3000"));
            config.setAllowedMethods(Collections.singletonList("*"));
            config.setAllowCredentials(true);
            config.setAllowedHeaders(Collections.singletonList("*"));
            config.setExposedHeaders(Arrays.asList("Authorization"));
            config.setMaxAge(3600L);
            return config;
        };
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            HttpSecurity http,
            PasswordEncoder passwordEncoder,
            UserDetailsService userDetailsService
    ) throws Exception {
        return http.getSharedObject(AuthenticationManagerBuilder.class)
                .userDetailsService(userDetailsService)
                .passwordEncoder(passwordEncoder)
                .and()
                .build();
    }
}
