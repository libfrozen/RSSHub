import type { Data, Route } from '@/types';
import type { Context } from 'hono';
import ofetch from '@/utils/ofetch';
import type { FollowResponse, Profile, Subscription } from './types';
import { parse } from 'tldts';

export const route: Route = {
    name: 'User subscriptions',
    categories: ['social-media'],
    path: '/profile/:uid',
    example: '/follow/profile/41279032429549568',
    parameters: {
        uid: 'User ID or user handle',
    },
    radar: [
        {
            source: ['app.follow.is/profile/:uid'],
            target: '/profile/:uid',
        },
    ],
    handler,
    maintainers: ['KarasuShin', 'DIYgod'],
    features: {
        supportRadar: true,
    },
};

async function handler(ctx: Context): Promise<Data> {
    const uid = ctx.req.param('uid');
    const host = 'https://api.follow.is';

    const profile = await ofetch<FollowResponse<Profile>>(`${host}/profiles?id=${uid}`);
    const subscriptions = await ofetch<FollowResponse<Subscription[]>>(`${host}/subscriptions?userId=${profile.data.id}`);

    return {
        title: `${profile.data.name}'s subscriptions`,
        item: subscriptions.data.map((subscription) => ({
            title: `Subscribed to ${subscription.feeds.title}`,
            description: subscription.feeds.description,
            link: `https://app.follow.is/feed/${subscription.feedId}`,
            image: getUrlIcon(subscription.feeds.siteUrl).src,
            category: [subscription.category],
        })),
        link: `https://app.follow.is/profile/${uid}`,
        image: profile.data.image,
    };
}

const getUrlIcon = (url: string, fallback?: boolean | undefined) => {
    let src: string;
    let fallbackUrl = '';

    try {
        const { host } = new URL(url);
        const pureDomain = parse(host).domainWithoutSuffix;
        fallbackUrl = `https://avatar.vercel.sh/${pureDomain}.svg?text=${pureDomain?.slice(0, 2).toUpperCase()}`;
        src = `https://unavatar.follow.is/${host}?fallback=${fallback || false}`;
    } catch {
        const pureDomain = parse(url).domainWithoutSuffix;
        src = `https://avatar.vercel.sh/${pureDomain}.svg?text=${pureDomain?.slice(0, 2).toUpperCase()}`;
    }
    const ret = {
        src,
        fallbackUrl,
    };

    return ret;
};
