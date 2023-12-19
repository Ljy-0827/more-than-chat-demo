const KEY = "sb-51d84835847b10d3b0a3738cd9ae33f7be21340a5917f392";

class p5GPT {
    messages = [];
    maxMessage = -1;

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
        console.log("in");
        console.log(prompt);
        let res = await axios({
            method: "post",
            url: "https://api.openai-sb.com/v1/chat/completions",
            headers: {
                Authorization: `Bearer ${KEY}`,
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

        //console.log(res);
        console.log(res.data.choices[0].message.content);

        return res.data.choices[0].message.content;
    }




    async dialog(prompt) {
        this.messages.push({
            role: "user",
            content: prompt,
        });

        // trim to max message
        if (this.maxMessage > 0) {
            this.messages = this.messages.slice(Math.max(this.messages.length - this.maxMessage, 0));
        }

        let res = await axios({
            method: "post",
            url: "https://api.openai-sb.com/v1/chat/completions",
            headers: {
                Authorization: `Bearer ${KEY}`,
                "Content-Type": "application/json",
            },
            data: JSON.stringify({
                model: "gpt-3.5-turbo",
                stream: false,
                messages: this.messages,
            }),
        });

        console.log(res);
        return res.data.choices[0].message.content;
    }
}