const routes = Object.freeze({
    root: '/',
    signIn: '/signin',
    projects: '/projects',
    orders: '/orders',
    pricing: '/pricingpage',
    // payment: "/projects/:projectId/payment",
    payment: '/payment',
    paymentForOrder: '/projects/:projectId/payment/:orderId?',
    billing: '/billing',
    project: '/projects/:projectId',
    privacy: '/privacy',
    contact: '/contact',
    productTour: '/producttour',
    docs: '/docs',
    apiGovernance: '/apigovernance',
    collections: '/collections',
    responseTab: '/response',
});

export const generateRoute = (route, data) => {
    if (route === routes.projects) {
        return `${routes.projects}/${data}`;
    } else if (route === routes.payment) {
        return `${routes.projects}/${data}/payment`;
    } else if (route === routes.paymentForOrder) {
        return `${routes.projects}/${data?.projectId}/payment/${data?.orderId}`;
    }
    return '/';
};

export default routes;
