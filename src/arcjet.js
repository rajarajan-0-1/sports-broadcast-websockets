import arcjet, {
  detectBot,
  shield,
  slidingWindow,
} from "@arcjet/node";

const arcjetKey = process.env.ARCJET_KEY;

const arcjetMode = process.env.ARCJECT_MODE === 'DRY_RUN' ? 'DRY_RUN' : 'LIVE';
// const arcjetMode = 'LIVE';

if(!arcjetKey) throw new Error('ARCJET_KEY is not set in environment variables');

export const httpArcjet = arcjetKey ? 
    arcjet({
        key: arcjetKey,
        rules: [
            // shield with Arcjet's bot detection engine, blocking all bots except search engine bots and preview bots + sql injection and XSS attacks
            shield({ mode: arcjetMode }),
            detectBot({allow: [
                "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
                // Uncomment to allow these other common bot categories
                // See the full list at https://arcjet.com/bot-list
                //"CATEGORY:MONITOR", // Uptime monitoring services
                //"CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
            ]}),
            // slidingWindow to limit the number of requests from a single IP address, allowing a maximum of 50 requests per 10 seconds
            slidingWindow({ mode: arcjetMode, interval: '10s', max: 50 })
        ]
    }) : null;

export const wsArcjet = arcjetKey ?
    arcjet({
        key: arcjetKey,
        rules: [
            // shield with Arcjet's bot detection engine, blocking all bots except search engine bots and preview bots + sql injection and XSS attacks
            shield({ mode: arcjetMode }),
            detectBot({allow: [
                "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
                // Uncomment to allow these other common bot categories
                // See the full list at https://arcjet.com/bot-list
                "CATEGORY:MONITOR", // Uptime monitoring services
                "CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
            ]}),
            // slidingWindow to limit the number of requests from a single IP address, allowing a maximum of 5 connections per 2 seconds
            slidingWindow({ mode: arcjetMode, interval: '2s', max: 5 })
        ]
    }) : null;

export function securityMiddleware() {
    return async(req, res, next) => {
        if(!httpArcjet) return next();
        try {
                //protect the route with Arcjet's bot detection and rate limiting middleware
                const decision = await httpArcjet.protect(req);
            
                if(decision.isDenied()) {
                    if(decision.reason.isRateLimit()) {
                        return res.status(429).json({ error: "Too many Reqests!" });
                    }
            
                    return res.status(403).json({ error: "Forbidden!" });   
                }
            } catch (error) {
                console.error('Error in Arcjet middleware:', error);
                return res.status(500).json({ error: 'Internal Server Error' });
     }
        next();
    }
}
