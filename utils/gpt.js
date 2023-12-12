class P5GPT {
    messages = [];
    maxMessage = 8;

    KEY = "sb-e5c96bbf92a0296c0ec642f479f72feadf87c84938f0622a";

    setMaxMessage(max) {
        try {
            max = parseInt(max);
        } catch (error) {
            return;
        }
        this.maxMessage = max;
    }

    clearAllMessage() {
        this.messages = [];
    }

    async single(prompt) {
        let res = await axios({
            method: "post",
            url: "https://api.openai-sb.com/v1/chat/completions",
            headers: {
                Authorization: `Bearer ${this.KEY}`,
                "Content-Type": "application/json",
            },
            data: JSON.stringify({
                model: "gpt-3.5-turbo",
                stream: false,
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            }),
        });

        console.log(res);

        return res.data.choices[0].message.content;
    }

    singleStream(prompt) {
        const res = fetch("https://api.openai-sb.com/v1/chat/completions", {
            headers: {
                Authorization: `Bearer ${this.KEY}`,
                "Content-Type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                stream: true,
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
            }),
        }).then((response) => {
            const reader = response.body.getReader();
            const textDecoder = new TextDecoder();

            const readData = () => {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        // 读取完毕，做一些结束处理
                        console.log("Stream finished.");
                        return;
                    }

                    let chunk = textDecoder.decode(value);
                    console.log(chunk);
                    chunk = chunk.split("\n");

                    // 去除开头的data:前缀
                    // chunk = chunk.replace(/^data: /, "");
                    console.log(chunk);

                    // 继续读取下一个数据块
                    readData();
                });
            };

            readData();
        });
    }

    async dialog(assistantPrompt, userPrompt){
        this.messages.push({
            role: "system",
            content: assistantPrompt,
        })
        this.messages.push({
            role: "user",
            content: userPrompt,
        })

        // trim to max message
        if (this.maxMessage > 0) {
            if (this.messages.length > this.maxMessage) {
                this.messages.splice(0, this.messages.length - this.maxMessage);
            }
        }

        console.log(this.messages);

        let res = await axios({
            method: "post",
            url: "https://api.openai-sb.com/v1/chat/completions",
            headers: {
                Authorization: `Bearer ${this.KEY}`,
                "Content-Type": "application/json",
            },
            data: JSON.stringify({
                model: "gpt-3.5-turbo",
                stream: false,
                messages: this.messages,
            }),
        });

        console.log(res);
        let content = res.data.choices[0].message.content;
        this.messages.push({
            role: "assistant",
            content: content,
        });
        return content;
    }
}

