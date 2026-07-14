package com.emart.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

/**
 * Sends SMS via Twilio when configured (provider=twilio). Otherwise it logs the message to the
 * console (provider=log) so the notification flow is fully testable without an account.
 * Sending is best-effort: failures are logged and swallowed so they never affect order processing.
 */
@Service
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);

    @Value("${app.sms.provider:log}")
    private String provider;
    @Value("${app.sms.default-country-code:+91}")
    private String defaultCountryCode;
    @Value("${app.twilio.account-sid:}")
    private String accountSid;
    @Value("${app.twilio.auth-token:}")
    private String authToken;
    @Value("${app.twilio.from-number:}")
    private String fromNumber;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10)).build();

    public boolean isTwilioConfigured() {
        return "twilio".equalsIgnoreCase(provider)
                && StringUtils.hasText(accountSid)
                && StringUtils.hasText(authToken)
                && StringUtils.hasText(fromNumber);
    }

    /** Send an SMS. Returns true if accepted by the provider; never throws. */
    public boolean send(String toMobile, String message) {
        String to = toE164(toMobile);
        if (to == null) {
            log.warn("[SMS] skipped: no valid recipient number");
            return false;
        }
        if (!isTwilioConfigured()) {
            // Dev/default mode: just print it so the flow is visible and testable.
            log.info("[SMS-DEV] To {} : {}", to, message);
            return false;
        }
        try {
            String body = "To=" + enc(to) + "&From=" + enc(fromNumber) + "&Body=" + enc(message);
            String auth = Base64.getEncoder().encodeToString(
                    (accountSid + ":" + authToken).getBytes(StandardCharsets.UTF_8));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json"))
                    .header("Authorization", "Basic " + auth)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> resp = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() >= 200 && resp.statusCode() < 300) {
                log.info("[SMS] sent to {}", to);
                return true;
            }
            log.warn("[SMS] Twilio responded {} : {}", resp.statusCode(), resp.body());
            return false;
        } catch (Exception e) {
            log.warn("[SMS] failed to send to {} : {}", to, e.getMessage());
            return false;
        }
    }

    /** Normalise a 10-digit Indian mobile to E.164 (+91...). Pass-through if already +prefixed. */
    private String toE164(String mobile) {
        if (!StringUtils.hasText(mobile)) return null;
        String m = mobile.trim().replaceAll("[\\s-]", "");
        if (m.startsWith("+")) return m;
        if (m.matches("\\d{10}")) return defaultCountryCode + m;
        if (m.matches("\\d{11,15}")) return "+" + m;
        return null;
    }

    private String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}
