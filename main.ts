import { Application, Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { Sha256 } from "https://deno.land/std@0.119.0/hash/sha256.ts";
import "https://deno.land/x/dotenv@v3.2.2/load.ts";

let site = "https://example.com";

const correctPin = new Sha256().update(Deno.env.get("PIN") || "1234")
  .toString();

const login = await Deno.readTextFile("./login.html");
const admin = await Deno.readTextFile("./admin.html");

const router = new Router();

router
  .get("/", (ctx) => ctx.response.redirect(site))
  .get("/admin", async (ctx) => {
    const pin = await ctx.cookies.get("pin") || "";
    if (pin === correctPin) {
      ctx.response.body = admin.replace(
        "{{site}}",
        site,
      );
    } else {
      ctx.response.body = login;
    }
  })
  .post("/admin/login", async (ctx) => {
    const body = await ctx.request.body({ type: "form" }).value;

    const pin = body.get("pin") || "";
    if (new Sha256().update(pin).toString() === correctPin) {
      ctx.cookies.set("pin", correctPin, {
        maxAge: 60 * 60 * 24,
        httpOnly: true,
      });
    }

    ctx.response.redirect("/admin");
  })
  .post("/admin/update", async (ctx) => {
    if (await ctx.cookies.get("pin") !== correctPin) {
      ctx.response.redirect("/admin");
      return;
    }

    const body = await ctx.request.body({ type: "form" }).value;
    site = body.get("url") || "";
    ctx.response.redirect("/admin");
  })
  .get("(.*)", (ctx) => ctx.response.redirect(site));

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

console.log("Server running on http://localhost:8080");
await app.listen({ port: 8080 });
