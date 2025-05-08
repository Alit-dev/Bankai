const axios = require("axios");

module.exports = {
  config: {
    name: "usage",
    version: "3.0",
    author: "Seba AI",
    role: 0,
    shortDescription: "ওষুধের ব্যবহারিক তথ্য সুন্দরভাবে দেয়",
    longDescription: "রিপ্লাই করা ওষুধের ইনফো থেকে AI দিয়ে বিশ্লেষণ করে সুন্দর বাংলায় ব্যবহারিক নির্দেশনা দেয়",
    category: "health",
    guide: "ওষুধের তথ্যযুক্ত মেসেজে রিপ্লাই দিয়ে লিখুন 'ব্যবহার'"
  },

  onStart: async () => {},

  onChat: async function ({ message, event, api }) {
    const input = event.body?.toLowerCase().trim();
    const triggers = ["ব্যবহার", "usage", "কিভাবে খাই", "কি জন্য খাই", "ব্যবহার বলো"];
    if (!triggers.includes(input)) return;

    if (!event.messageReply || !event.messageReply.body) {
      return message.reply("ওষুধের তথ্যযুক্ত মেসেজে রিপ্লাই করে 'ব্যবহার' বলুন।");
    }

    api.setMessageReaction("⌛", event.messageID, () => {}, true);

    const text = event.messageReply.body;
    const name = text.match(/Name: (.+)/)?.[1] || "";
    const fullName = text.match(/Full Name: (.+)/)?.[1] || "";
    const generic = text.match(/Generic: (.+)/)?.[1] || "";
    const strength = text.match(/Strength: (.+)/)?.[1] || "";
    const manufacturer = text.match(/Manufacturer: (.+)/)?.[1] || "";

    const basePrompt = `ওষুধের নাম: ${name}\nপুরো নাম: ${fullName}\nজেনেরিক: ${generic}\nস্ট্রেন্থ: ${strength}\nপ্রস্তুতকারক: ${manufacturer}\n\n`;

    const prompts = [
      basePrompt + "এই ওষুধটি কোন কোন সমস্যার জন্য ব্যবহৃত হয় তা বাংলায় লিখো।",
      basePrompt + "এই ওষুধটি কীভাবে খেতে হয়, ডোজ কত, এবং কোন কোন সতর্কতা মেনে চলতে হয় তা বাংলায় লিখো।",
      basePrompt + "এই ওষুধটির পার্শ্বপ্রতিক্রিয়া কী কী হতে পারে তা বাংলায় লিখো।"
    ];

    const mixtralKeys = [
      "38e3e9671d3cdee7dae8f33126376ea40f571ea436bd39ef4c398422ab3215cd",
      "eab31294aff2e352a97f25112af6336d30e3734b0503b6e35806b60caef6265d",
      "685dcc6c37b27254f6c7182efe38f68664f3df8e4397d7667864706571bb5be2"
    ];

    try {
      // Step 1: Get raw response from Mixtral
      const mixtralResponses = await Promise.all(prompts.map((p, i) =>
        axios.post("https://api.together.xyz/v1/chat/completions", {
          model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
          messages: [
            { role: "system", content: "তুমি একজন বাংলা ভাষাভাষী মেডিকেল সহকারী। তথ্য সুন্দরভাবে এবং নির্ভুল বাংলায় দাও।" },
            { role: "user", content: p }
          ],
          max_tokens: 700,
          temperature: 0.7
        }, {
          headers: {
            Authorization: `Bearer ${mixtralKeys[i]}`,
            "Content-Type": "application/json"
          }
        })
      ));

      const combinedText = mixtralResponses.map(r => r.data.choices[0].message.content.trim()).join("\n\n");

      // Step 2: Polish with DeepSeek
      const finalPolished = await axios.post("https://api.together.xyz/v1/chat/completions", {
        model: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",
        messages: [
          {
            role: "system",
            content: "তুমি একজন দক্ষ বাংলা কনটেন্ট এডিটর, যিনি মেডিকেল তথ্য সহজ, পরিষ্কার ও নির্ভুলভাবে উপস্থাপন করেন। ভাষা হতে হবে প্রাঞ্জল, ভুলহীন, এবং বোঝার সুবিধাজনক।"
          },
          {
            role: "user",
            content: `নীচের ওষুধ সম্পর্কিত তথ্যটি আরও সুন্দর, সঠিক এবং উপযুক্ত করে সাজাও। ** এগুলা ইউজ করবে নাহ এবং আলাদা পেরা পেরা করে লিখবে এবং আমাকে ফুল এক্সপ্লেনশন দিবে। পেরা আলাদা করতে নরমাল টেক্সচার অ্যাড করতে পারো :\n\n${combinedText}`
          }
        ],
        max_tokens: 3000,
        temperature: 0.5
      }, {
        headers: {
          Authorization: "Bearer 1d656f6f282fc0ac7a67bf2af85d2c0ebce17145d19e7d7e3faf6ea3dc864b07",
          "Content-Type": "application/json"
        }
      });

      // Remove <think> tags from DeepSeek output
      let finalText = finalPolished.data.choices[0].message.content.trim();
      finalText = finalText.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

      api.setMessageReaction("✅", event.messageID, () => {}, true);
      return message.reply(`**${fullName || name}** এর ব্যবহারিক তথ্য:\n\n${finalText}`);
    } catch (e) {
      console.error("Usage Command Error:", e);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("ব্যবহারিক তথ্য আনতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।");
    }
  }
};