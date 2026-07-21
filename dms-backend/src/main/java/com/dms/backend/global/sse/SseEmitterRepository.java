package com.dms.backend.global.sse;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Repository
public class SseEmitterRepository {

    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter save(String emitterId, SseEmitter sseEmitter) {
        emitters.put(emitterId, sseEmitter);
        log.info("SSE 커넥션 생성 등록: emitterId={}", emitterId);
        return sseEmitter;
    }

    public void deleteById(String emitterId) {
        emitters.remove(emitterId);
        log.info("SSE 커넥션 제거: emitterId={}", emitterId);
    }

    public SseEmitter get(String emitterId) {
        return emitters.get(emitterId);
    }

    public Map<String, SseEmitter> findAllEmitters() {
        return emitters;
    }

    public void sendToAll(String eventName, Object data) {
        emitters.forEach((id, emitter) -> {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventName)
                        .data(data));
            } catch (Exception e) {
                log.warn("SSE 브로드캐스트 송신 실패로 커넥션 제거: id={}", id);
                deleteById(id);
            }
        });
    }
}
