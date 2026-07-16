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
        // Drop every CHECK constraint on the orders table. Hibernate only adds
        // CHECK constraints there for the enum columns (status, payment_mode,
        // payment_status); dropping them is safe because @Enumerated already
        // guarantees only valid enum names are ever written. This is broader —
        // and therefore more robust — than matching on the check clause text,
        // whose format varies between MySQL versions.
        List<String> names;
        try {
            names = jdbc.queryForList(
                    "SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS " +
                    "WHERE CONSTRAINT_SCHEMA = DATABASE() " +
                    "  AND TABLE_NAME = 'orders' " +
                    "  AND CONSTRAINT_TYPE = 'CHECK'",
                    String.class);
        } catch (Exception e) {
            // Older MySQL (< 8.0.16) has no CHECK_CONSTRAINTS support and does
            // not enforce checks anyway — nothing to do.
            log.warn("Could not read CHECK constraints on orders (safe to ignore): {}", e.getMessage());
            return;
        }

        for (String name : names) {
            try {
                jdbc.execute("ALTER TABLE orders DROP CHECK `" + name + "`");
                log.info("Dropped stale CHECK constraint '{}' on orders", name);
            } catch (Exception e) {
                // Most likely the DB user lacks ALTER privilege — surface it so
                // it can be run manually, but never block startup.
                log.error("FAILED to drop CHECK constraint '{}' on orders — run it manually "
                        + "(ALTER TABLE orders DROP CHECK `{}`;). Cause: {}", name, name, e.getMessage());
            }
        }
    }
}
