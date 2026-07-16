package com.emart.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * One-time schema fix for the orders.payment_mode column.
 *
 * On MySQL, Hibernate 6 (Spring Boot 3) maps an {@code @Enumerated(EnumType.STRING)}
 * field to a NATIVE ENUM column — e.g. {@code enum('COD','ONLINE')} — listing only
 * the values that existed when the table was first created. With
 * {@code ddl-auto=update} that column definition is never widened, so inserting a
 * newly added value (UPI_QR) fails with MySQL error 1265 "Data truncated for
 * column 'payment_mode'" and the order request returns a 500.
 *
 * This converts the column to a plain VARCHAR so it accepts the current and any
 * future PaymentMode values. It is idempotent (only alters when the column is
 * still an ENUM) and defensive: any failure is logged with the manual SQL to run
 * and never blocks application startup.
 */
@Component
public class PaymentModeConstraintFix implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(PaymentModeConstraintFix.class);

    private static final String MANUAL_SQL =
            "ALTER TABLE orders MODIFY payment_mode VARCHAR(32) NOT NULL;";

    private final JdbcTemplate jdbc;

    public PaymentModeConstraintFix(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        String columnType;
        try {
            columnType = jdbc.queryForObject(
                    "SELECT COLUMN_TYPE FROM information_schema.COLUMNS " +
                    "WHERE TABLE_SCHEMA = DATABASE() " +
                    "  AND TABLE_NAME = 'orders' " +
                    "  AND COLUMN_NAME = 'payment_mode'",
                    String.class);
        } catch (Exception e) {
            // Column/table not found yet, or information_schema unavailable — nothing to do.
            log.warn("Could not inspect orders.payment_mode column (safe to ignore): {}", e.getMessage());
            return;
        }

        if (columnType == null || !columnType.toLowerCase().startsWith("enum")) {
            // Already VARCHAR (or some other non-enum type) — no change needed.
            return;
        }

        try {
            jdbc.execute("ALTER TABLE orders MODIFY payment_mode VARCHAR(32) NOT NULL");
            log.info("Converted orders.payment_mode from {} to VARCHAR(32)", columnType);
        } catch (Exception e) {
            // Most likely the DB user lacks ALTER privilege — surface the fix clearly.
            log.error("FAILED to widen orders.payment_mode (currently {}). UPI orders will keep "
                    + "failing until you run this on the database manually: {}  Cause: {}",
                    columnType, MANUAL_SQL, e.getMessage());
        }
    }
}
