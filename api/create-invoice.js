export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const botToken = process.env.BOT_TOKEN;

        if (!botToken) {
            return res.status(500).json({
                error: "BOT_TOKEN manquant"
            });
        }

        const { initData, productId } = req.body;

        if (!initData) {
            return res.status(400).json({
                error: "initData manquant"
            });
        }

        /*
         * Pour l'instant nous avons un seul produit.
         *
         * Plus tard, ces informations viendront
         * d'une vraie base de données.
         */

        const products = {
            "produit-1": {
                title: "Mon premier produit",
                description: "Mon premier produit numérique",
                price: 100
            }
        };

        const product = products[productId];

        if (!product) {
            return res.status(404).json({
                error: "Produit introuvable"
            });
        }

        /*
         * Payload associé à la commande.
         *
         * Il sera reçu plus tard par notre webhook
         * lors du paiement.
         */

        const payload = JSON.stringify({
            productId: productId
        });

        /*
         * Création de la facture Telegram Stars.
         */

        const response = await fetch(
            `https://api.telegram.org/bot${botToken}/createInvoiceLink`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    title: product.title,

                    description: product.description,

                    payload: payload,

                    currency: "XTR",

                    prices: [
                        {
                            label: product.title,
                            amount: product.price
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!data.ok) {
            console.error(data);

            return res.status(500).json({
                error: "Telegram n'a pas pu créer la facture"
            });
        }

        return res.status(200).json({
            invoiceUrl: data.result
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Erreur serveur"
        });
    }
}
