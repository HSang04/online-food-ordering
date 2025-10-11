/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.ths.onlinefood.controller;

import com.ths.onlinefood.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.*;


@RestController
@RequestMapping("/api")
@CrossOrigin
public class VNPayController {

    @Autowired
    private VNPayService vnpayService;

    @GetMapping("/create-payment")
    public ResponseEntity<Map<String, Object>> createPayment(
            @RequestParam("bookingId") String bookingId,
            @RequestParam("amount") long amount,
            @RequestParam("bankCode") String bankCode,
            HttpServletRequest request) {

        try {
            String paymentUrl = vnpayService.createPayment(bookingId, amount, bankCode, request);

            return ResponseEntity.ok(Map.of(
                    "code", "00",
                    "message", "Success",
                    "paymentUrl", paymentUrl
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "code", "99",
                    "message", e.getMessage()
            ));
        }
    }

     @GetMapping("/payment-result")
    public ResponseEntity<Map<String, String>> handlePaymentResult(
            @RequestParam Map<String, String> params, HttpServletRequest request) {
        try {
            // Debug: In ra tất cả params nhận được
            System.out.println("=== VNPay Callback Parameters ===");
            params.forEach((key, value) -> 
                System.out.println(key + " = " + value)
            );
            System.out.println("================================");
            
            // Validate signature
            boolean isValid = vnpayService.validatePaymentResponse(params);
            System.out.println("Signature validation result: " + isValid);
            
            if (!isValid) {
                System.err.println("Invalid signature detected!");
                return ResponseEntity.badRequest().body(Map.of(
                        "code", "97",
                        "message", "Invalid signature"
                ));
            }
            
            String responseCode = params.get("vnp_ResponseCode");
            String transactionNo = params.get("vnp_TransactionNo");
            String txnRef = params.get("vnp_TxnRef");
            
            System.out.println("Response Code: " + responseCode);
            System.out.println("Transaction No: " + transactionNo);
            System.out.println("TxnRef: " + txnRef);
            
            if ("00".equals(responseCode)) {
                return ResponseEntity.ok(Map.of(
                        "code", "00",
                        "message", "Payment successful",
                        "transactionId", transactionNo != null ? transactionNo : ""
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                        "code", responseCode,
                        "message", "Payment failed: " + params.getOrDefault("vnp_ResponseCode", "Unknown")
                ));
            }
            
        } catch (Exception ex) {
            System.err.println("Exception in payment result handler: " + ex.getMessage());
            ex.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of(
                    "code", "99",
                    "message", "Exception: " + ex.getMessage()
            ));
        }
    }
}