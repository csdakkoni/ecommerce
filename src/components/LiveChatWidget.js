'use client';

import { useEffect } from 'react';
import Script from 'next/script';

/**
 * Live Chat Widget Component
 * Supports Tawk.to, Crisp, and Intercom
 * 
 * Environment variables:
 * - NEXT_PUBLIC_TAWKTO_ID=xxxxxxxx/xxxxxxxx
 * - NEXT_PUBLIC_CRISP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 * - NEXT_PUBLIC_INTERCOM_APP_ID=xxxxxxxx
 */

const TAWKTO_ID = process.env.NEXT_PUBLIC_TAWKTO_ID;
const CRISP_ID = process.env.NEXT_PUBLIC_CRISP_ID;
const INTERCOM_APP_ID = process.env.NEXT_PUBLIC_INTERCOM_APP_ID;

export default function LiveChatWidget({ user }) {
    // Set user data for chat widgets when user is authenticated
    useEffect(() => {
        if (user) {
            // Tawk.to user data
            if (typeof window !== 'undefined' && window.Tawk_API) {
                window.Tawk_API.setAttributes({
                    name: user.user_metadata?.first_name || user.email,
                    email: user.email,
                }, function (error) { });
            }

            // Crisp user data
            if (typeof window !== 'undefined' && window.$crisp) {
                window.$crisp.push(['set', 'user:email', user.email]);
                if (user.user_metadata?.first_name) {
                    window.$crisp.push(['set', 'user:nickname', user.user_metadata.first_name]);
                }
            }

            // Intercom user data
            if (typeof window !== 'undefined' && window.Intercom) {
                window.Intercom('update', {
                    email: user.email,
                    name: user.user_metadata?.first_name || user.email,
                    created_at: Math.floor(new Date(user.created_at).getTime() / 1000),
                });
            }
        }
    }, [user]);

    return (
        <>
            {/* Tawk.to */}
            {TAWKTO_ID && (
                <Script id="tawk-to" strategy="lazyOnload">
                    {`
                        var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
                        (function(){
                            var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
                            s1.async=true;
                            s1.src='https://embed.tawk.to/${TAWKTO_ID}';
                            s1.charset='UTF-8';
                            s1.setAttribute('crossorigin','*');
                            s0.parentNode.insertBefore(s1,s0);
                        })();
                    `}
                </Script>
            )}

            {/* Crisp */}
            {CRISP_ID && (
                <Script id="crisp-chat" strategy="lazyOnload">
                    {`
                        window.$crisp=[];
                        window.CRISP_WEBSITE_ID="${CRISP_ID}";
                        (function(){
                            var d=document;
                            var s=d.createElement("script");
                            s.src="https://client.crisp.chat/l.js";
                            s.async=1;
                            d.getElementsByTagName("head")[0].appendChild(s);
                        })();
                    `}
                </Script>
            )}

            {/* Intercom */}
            {INTERCOM_APP_ID && (
                <Script id="intercom" strategy="lazyOnload">
                    {`
                        window.intercomSettings = {
                            api_base: "https://api-iam.intercom.io",
                            app_id: "${INTERCOM_APP_ID}"
                        };
                        (function(){
                            var w=window;var ic=w.Intercom;
                            if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}
                            else{var d=document;var i=function(){i.c(arguments);};
                            i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;
                            var l=function(){var s=d.createElement('script');s.type='text/javascript';
                            s.async=true;s.src='https://widget.intercom.io/widget/${INTERCOM_APP_ID}';
                            var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};
                            if(document.readyState==='complete'){l();}
                            else if(w.attachEvent){w.attachEvent('onload',l);}
                            else{w.addEventListener('load',l,false);}}
                        })();
                    `}
                </Script>
            )}
        </>
    );
}

/**
 * Helper functions for programmatic chat control
 */
export const liveChat = {
    // Open chat widget
    open: () => {
        if (typeof window !== 'undefined') {
            if (window.Tawk_API) window.Tawk_API.maximize();
            if (window.$crisp) window.$crisp.push(['do', 'chat:open']);
            if (window.Intercom) window.Intercom('show');
        }
    },

    // Close chat widget
    close: () => {
        if (typeof window !== 'undefined') {
            if (window.Tawk_API) window.Tawk_API.minimize();
            if (window.$crisp) window.$crisp.push(['do', 'chat:close']);
            if (window.Intercom) window.Intercom('hide');
        }
    },

    // Send automatic message (for support scenarios)
    sendMessage: (message) => {
        if (typeof window !== 'undefined') {
            if (window.$crisp) {
                window.$crisp.push(['do', 'message:send', ['text', message]]);
            }
        }
    },

    // Show custom message from bot
    showBotMessage: (message) => {
        if (typeof window !== 'undefined') {
            if (window.$crisp) {
                window.$crisp.push(['do', 'message:show', ['text', message]]);
            }
        }
    },
};
