export default async function handler(req, res) {

    if (req.method !== "GET") {

        return res.status(405).json({
            error: "Method not allowed"
        });

    }

    try {

        const botToken =
            process.env.BOT_TOKEN;

        const webhookSecret =
            process.env.WEBHOOK_SECRET;

        const setupKey =
            process.env.SETUP_KEY;

        /*
         * Protection supplémentaire.
         */

        if (
            req.query.key !== setupKey
        ) {

            return res.status(401).json({
                error: "Unauthorized"
            });

        }

        /*
         * URL de notre webhook.
         */

        const webhookUrl =
            `${process.env.VERCEL_URL
                ? "https://" + process.env.VERCEL_URL
                : ""
            }/api/telegram-webhook`;

        /*
         * Configuration du webhook Telegram.
         */

        const response = await fetch(

            `https://api.telegram.org/bot${botToken}/setWebhook`,

            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    url: webhookUrl,

                    secret_token:
                        webhookSecret,

                    allowed_updates: [

                        "message"

                    ]

                })

            }

        );

        const result =
            await response.json();

        return res.status(200).json({

            webhookUrl,

            telegram: result

        });

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            error: "Impossible de configurer le webhook"

        });

    }

}
