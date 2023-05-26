try {
import { Application } from "https://deno.land/x/abc@v1.3.3/mod.ts";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";
import { Message, Sha256 } from "https://deno.land/std@0.119.0/hash/sha256.ts";
import "https://deno.land/x/dotenv@v3.2.2/load.ts";

const app = new Application();

console.log("http://localhost:8080/");
let site = "https://example.com";
const correctPin = new Sha256().update((Deno.env.get("PIN") as Message) || "1234").toString();

app
  .get("/", (c) => {
    c.redirect(site);
  })
  .get("/admin", async (c) => {
    if (c.cookies.pin === correctPin) {
      return (await Deno.readTextFile("./admin.html")).replace(
        "{{site}}",
        site,
      );
    } else {
      return await Deno.readTextFile("./login.html");
    }
  })
  .post("/admin/login", async (c) => {
    const body = await c.body;
    const type = z.object({
      pin: z.string(),
    }).safeParse(body);
    if (!type.success) {
      return c.redirect("/admin");
    }
    const { pin } = type.data;
    if (new Sha256().update(pin).toString() === correctPin) {
      c.setCookie({
        name: "pin",
        value: correctPin,
        maxAge: 60 * 60 * 24,
        httpOnly: true,
      });
      c.redirect("/admin");
    } else {
      c.redirect("/admin");
    }
  })
  .post("/admin/update", async (c) => {
    if (!c.cookies?.pin || c.cookies.pin !== correctPin) {
      return c.redirect("/admin");
    }
    const body = await c.body;
    const type = z.object({
      url: z.string(),
    }).safeParse(body);
    if (!type.success) {
      return c.redirect("/admin");
    }
    site = type.data.url;
    c.redirect("/admin");
  })
  .start({ port: 8080 });
} catch (e) {
  console.error(e);
}