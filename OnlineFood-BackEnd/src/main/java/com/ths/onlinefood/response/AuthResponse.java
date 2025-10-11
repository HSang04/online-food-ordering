/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.response;


import com.ths.onlinefood.model.USER_ROLE;
import lombok.Data;

@Data
public class AuthResponse {

    private Long id;
    private String jwt;

    private String message;

    private USER_ROLE role;
}
