package com.yourfamily;

import io.javalin.Javalin;
import io.javalin.json.JavalinJackson;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.util.List;

public class Main {
    public static void main(String[] args) throws Exception {
        // DB準備
        Database.startServer();
        Database.initSchema();

        ScheduleRepository scheduleRepository = new ScheduleRepository();
        PickupResponseRepository responseRepository = new PickupResponseRepository();

        ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

        Javalin app = Javalin.create(config -> {
            config.jsonMapper(new JavalinJackson(objectMapper, true));
        }).start(7000);

        app.get("/", ctx -> {
            ctx.contentType("text/plain; charset=UTF-8");
            ctx.result("帰省予定アプリ、起動しました！");
        });

        // 帰省予定の一覧を取得する
        app.get("/schedules", ctx -> {
            List<Schedule> schedules = scheduleRepository.findAll();
            ctx.json(schedules);
        });

        // 新しい帰省予定を登録する
        app.post("/schedules", ctx -> {
            Schedule newSchedule = ctx.bodyAsClass(Schedule.class);
            Schedule saved = scheduleRepository.save(newSchedule);
            ctx.status(201).json(saved);
        });

        // 特定の予定に対する送迎回答の一覧を取得する
        app.get("/schedules/{id}/responses", ctx -> {
            Long scheduleId = Long.parseLong(ctx.pathParam("id"));
            List<PickupResponse> responses = responseRepository.findByScheduleId(scheduleId);
            ctx.json(responses);
        });

        // 送迎回答を追加する（「行けるよ」ボタン）
        app.post("/schedules/{id}/responses", ctx -> {
            Long scheduleId = Long.parseLong(ctx.pathParam("id"));
            PickupResponse newResponse = ctx.bodyAsClass(PickupResponse.class);
            newResponse.scheduleId = scheduleId; // URLのidを優先して設定する
            PickupResponse saved = responseRepository.save(newResponse);
            ctx.status(201).json(saved);
        });

        // 送迎回答を削除する（押し間違いの取り消し）
        app.delete("/responses/{id}", ctx -> {
            Long responseId = Long.parseLong(ctx.pathParam("id"));
            responseRepository.delete(responseId);
            ctx.status(204);
        });
    }
}