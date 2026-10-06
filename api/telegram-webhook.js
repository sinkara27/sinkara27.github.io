export default async function handler(req, res) {

    if (req.method !== "POST") {

        return res.status(405).json({
            error: "Method not allowed"
        });

    }

    try {

        const botToken = process.env.BOT_TOKEN;

        const webhookSecret =
            process.env.WEBHOOK_SECRET;

        /*
         * Vérification de la signature secrète
         * envoyée par Telegram.
         */

        const receivedSecret =
            req.headers["x-telegram-bot-api-secret-token"];

        if (
            !webhookSecret ||
            receivedSecret !== webhookSecret
        ) {

            return res.status(401).json({
                error: "Unauthorized"
            });

        }

        const update = req.body;

        /*
         * =========================================
         * PRE-CHECKOUT
         * =========================================
         */

        if (update.pre_checkout_query) {

            const query =
                update.pre_checkout_query;

            /*
             * On vérifie la devise.
             */

            if (query.currency !== "XTR") {

                await telegramRequest(

                    botToken,

                    "answerPreCheckoutQuery",

                    {

                        pre_checkout_query_id:
                            query.id,

                        ok: false,

                        error_message:
                            "Devise de paiement invalide."

                    }

                );

                return res.status(200).json({
                    ok: true
                });

            }

            /*
             * Vérification du montant.
             *
             * Pour notre produit actuel :
             * 100 Stars.
             */

            if (query.total_amount !== 100) {

                await telegramRequest(

                    botToken,

                    "answerPreCheckoutQuery",

                    {

                        pre_checkout_query_id:
                            query.id,

                        ok: false,

                        error_message:
                            "Prix incorrect."

                    }

                );

                return res.status(200).json({
                    ok: true
                });

            }

            /*
             * Tout est correct.
             *
             * On autorise le paiement.
             */

            await telegramRequest(

                botToken,

                "answerPreCheckoutQuery",

                {

                    pre_checkout_query_id:
                        query.id,

                    ok: true

                }

            );

            return res.status(200).json({
                ok: true
            });

        }

        /*
         * =========================================
         * PAIEMENT RÉUSSI
         * =========================================
         */

        if (
            update.message &&
            update.message.successful_payment
        ) {

            const payment =
                update.message.successful_payment;

            const chatId =
                update.message.chat.id;

            /*
             * Vérification de sécurité.
             */

            if (payment.currency !== "XTR") {

                return res.status(200).json({
                    ok: true
                });

            }

            /*
             * On vérifie que le montant correspond
             * bien à notre produit.
             */

            if (payment.total_amount !== 100) {

                return res.status(200).json({
                    ok: true
                });

            }

            /*
             * Le paiement est réellement confirmé.
             *
             * Telegram recommande de se baser sur
             * successful_payment pour livrer le produit.
             */

            await telegramRequest(

                botToken,

                "sendMessage",

                {

                    chat_id: chatId,

                    text:
                        "✅ Paiement confirmé !\n\n" +
                        "Merci pour ton achat.\n\n" +
                        "📦 Ton produit numérique est prêt.\n\n" +
                        "La livraison automatique du fichier sera ajoutée dans la prochaine étape."

                }

            );

            /*
             * On conserve pour l'instant
             * l'identifiant du paiement dans les logs.
             */

            console.log(
                "PAIEMENT RÉUSSI:",
                payment.telegram_payment_charge_id
            );

            return res.status(200).json({
                ok: true
            });

        }

        /*
         * Aucun événement qui nous intéresse.
         */

        return res.status(200).json({
            ok: true
        });

    }

    catch (error) {

        console.error(
            "Webhook error:",
            error
        );

        /*
         * On retourne 200 pour éviter que Telegram
         * considère inutilement l'update comme échoué.
         */

        return res.status(200).json({
            ok: true
        });

    }

}


/*
 * Fonction permettant d'appeler Telegram Bot API.
 */

async function telegramRequest(
    botToken,
    method,
    data
) {

    const response = await fetch(

        `https://api.telegram.org/bot${botToken}/${method}`,

        {

            method: "POST",

            headers: {

                "Content-Type":
                    "application/json"

            },

            body: JSON.stringify(data)

        }

    );

    const result =
        await response.json();

    if (!result.ok) {

        console.error(
            `Erreur Telegram ${method}:`,
            result
        );

    }

    return result;

}
