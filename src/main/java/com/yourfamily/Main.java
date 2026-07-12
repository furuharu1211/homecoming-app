package com.yourfamily;

import io.javalin.Javalin;

public class Main {
    public static void main(String[] args) {
        Javalin app = Javalin.create().start(7000);

        app.get("/", ctx -> {
            ctx.contentType("text/plain; charset=UTF-8");
            ctx.result("帰省予定アプリ、起動しました！");
        });
    }
}