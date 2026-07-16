package com.emart.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * One-time schema fix for the orders.payment_mode enum column.
 *
 * Hibernate 6 (Spring Boot 3) generates a CHECK constraint for an
 * {@code @Enumerated(EnumType.STRING)} column listing only the enum values that
 * existed when the table was first created (COD, ONLINE). With
 * {@code ddl-auto=update} that constraint is never refreshed, so inserting a
 * newly added value (UPI_QR) violates it and the order fails with a database
 * error ("something went wrong" on the client).
 *
 * This drops any CHECK constraint on orders.payment_mode so the underlying
 * VARCHAR column accepts the current and future enum values. It is idempotent
 * and fully defensive: if there is no such constraint, or the database does not
 * expose/enforce CHECK constraints, it does nothing and never blocks startup.
 */
@Component
public class PaymentModeConstraintFix implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(PaymentModeConstraintFix.class);

    private final JdbcTemplate jdbc;

    public PaymentModeConstraintFix(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        try {
            List<String> names = jdbc.queryForList(
                    "SELECT cc.CONSTRAINT_NAME " +
                    "FROM information_schema.CHECK_CONSTRAINTS cc " +
                    "JOIN information_schema.TABLE_CONSTRAINTS tc " +
                    "  ON cc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA " +
                    "  AND cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME " +
                    "WHERE tc.CONSTRAINT_SCHEMA = DATABASE() " +
                    "  AND tc.TABLE_NAME = 'orders' " +
                    "  AND cc.CHECK_CLAUSE LIKE '%payment_mode%'",
                    String.class);

            for (String name : names) {
                jdbc.execute("ALTER TABLE orders DROP CHECK `" + name + "`");
                log.info("Dropped stale CHECK constraint '{}' on orders.payment_mode", name);
            }
        } catch (Exception e) {
            // Never block startup — the constraint may not exist or the DB may
            // not support CHECK_CONSTRAINTS (older MySQL). Safe to ignore.
            log.warn("Skipped orders.payment_mode CHECK-constraint cleanup: {}", e.getMessage());
        }
    }
}
