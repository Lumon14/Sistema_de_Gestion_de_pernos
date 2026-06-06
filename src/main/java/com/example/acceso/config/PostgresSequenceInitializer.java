package com.example.acceso.config;

import jakarta.persistence.EntityManager;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
public class PostgresSequenceInitializer {

    private final EntityManager entityManager;

    public PostgresSequenceInitializer(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void syncSequences() {
        syncSequence("productos", "productos_id_seq");
    }

    private void syncSequence(String table, String sequence) {
        entityManager.createNativeQuery(
                "SELECT setval('" + sequence + "', COALESCE((SELECT MAX(id) FROM " + table + "), 1))"
        ).getSingleResult();
    }
}
