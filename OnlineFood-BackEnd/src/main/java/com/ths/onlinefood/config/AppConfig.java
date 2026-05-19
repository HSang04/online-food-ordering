package com.ths.onlinefood.config;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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

@Configuration
public class AppConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            .csrf(csrf -> csrf.disable())

            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            .authorizeHttpRequests(authz -> authz

                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                .requestMatchers("/auth/signup", "/auth/login").permitAll()

                .requestMatchers("/auth/signup-by-admin")
                    .hasAnyAuthority("ADMIN", "QUANLY")

                .requestMatchers("/api/delivery/**").permitAll()
                .requestMatchers("/api/delivery/route/bounded-dijkstra/**").permitAll()

                .requestMatchers("/api/admin/**")
                    .hasAnyAuthority("ADMIN", "QUANLY")

                .requestMatchers("/api/nguoi-dung/secure/**")
                    .authenticated()

                .requestMatchers(HttpMethod.POST, "/api/nguoi-dung")
                    .permitAll()

                .requestMatchers(HttpMethod.GET, "/api/nguoi-dung/**")
                    .authenticated()

                .requestMatchers("/api/nguoi-dung/**")
                    .hasAnyAuthority("ADMIN", "QUANLY")

                .requestMatchers(HttpMethod.GET,
                        "/api/danh-muc",
                        "/api/mon-an")
                    .permitAll()

                .requestMatchers(HttpMethod.GET,
                        "/api/danh-muc/**",
                        "/api/mon-an/**")
                    .permitAll()

                .requestMatchers(HttpMethod.GET,
                        "/api/danh-gia-mon-an/**")
                    .permitAll()

                .requestMatchers(HttpMethod.POST,
                        "/api/danh-gia-mon-an/**")
                    .authenticated()

                .requestMatchers(HttpMethod.PUT,
                        "/api/danh-gia-mon-an/**")
                    .authenticated()

                .requestMatchers(HttpMethod.DELETE,
                        "/api/danh-gia-mon-an/**")
                    .authenticated()

                .requestMatchers(HttpMethod.GET,
                        "/api/hinh-anh-mon-an/**")
                    .permitAll()

                .requestMatchers("/api/gio-hang/**")
                    .hasAnyAuthority("KHACHHANG")

                .requestMatchers("/api/tin-nhan/**")
                    .hasAnyAuthority(
                        "ADMIN",
                        "QUANLY",
                        "NHANVIEN_QUANLYDONHANG",
                        "NHANVIEN_QUANLYMONAN",
                        "KHACHHANG"
                    )

                .requestMatchers(HttpMethod.GET, "/api/hoa-don/**")
                    .hasAnyAuthority(
                        "ADMIN",
                        "QUANLY",
                        "NHANVIEN_QUANLYDONHANG",
                        "KHACHHANG"
                    )

                .requestMatchers(HttpMethod.POST, "/api/hoa-don/**")
                    .hasAnyAuthority(
                        "ADMIN",
                        "QUANLY",
                        "NHANVIEN_QUANLYDONHANG",
                        "KHACHHANG"
                    )

                .requestMatchers(HttpMethod.GET,
                        "/api/thong-tin-cua-hang/**")
                    .permitAll()

                .requestMatchers(
                        "/swagger-ui/**",
                        "/swagger-ui.html",
                        "/v3/api-docs/**")
                    .permitAll()

                .requestMatchers("/api/**")
                    .authenticated()

                .anyRequest().permitAll()
            )

            .addFilterBefore(
                new JwtTokenValidator(),
                BasicAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {

        return request -> {

            CorsConfiguration config = new CorsConfiguration();

            config.setAllowedOrigins(Arrays.asList(
                "http://localhost:3000",
                "https://online-food-ordering-delta.vercel.app"
            ));

            config.setAllowedMethods(Arrays.asList(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
            ));

            config.setAllowedHeaders(Arrays.asList("*"));

            config.setExposedHeaders(Arrays.asList(
                "Authorization"
            ));

            config.setAllowCredentials(true);

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