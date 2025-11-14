import Dashboard from '../Dashboard';

import '../shared/components/collaborators.css';

const ConekttoDocs = () => {
    const url = `https://docs.conektto.io`;

    const navigateToDocs = () => {
        const docsUrl = 'https://docs.conektto.io';
        window.open(docsUrl, '_blank');
        return null;
    };

    //console.log("productVideos:", productVideosData);
    return (
        <Dashboard selectedIndex={5}>
            <div className="mt-16">
                <div className="mb-4" align="center">
                    {/* <iframe
          width="1000"
          height="500"
        src={
            productVideosData &&
            productVideosData.productVideos[index].youtubeURL
          }
          src = {url}
          frameborder="0"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        /> */}
                    <div style={{ width: '1000px' }}>
                        <h6 className="mt-4" style={{ textAlign: 'left' }}>
                            Conektto. - API-First Design & Test Platform
                        </h6>
                        <p className="mt-3 mb-2" style={{ textAlign: 'start' }}>
                            Welcome to Conektto Docs
                        </p>
                    </div>
                </div>
                <div style={{ width: '1000px' }}>
                    <div className="border-t-2 flex flex-row items-center justify-center" align="center">
                        <p className="mt-3 mb-4 ml-24" style={{ textAlign: 'start' }}>
                            Conektto is the API-First platform for business to design, built, test and manage APIs as
                            products. Conektto has two products, namely Design Studio and Test Studio.
                        </p>
                    </div>
                    <div className="flex flex-row items-center justify-center" align="center">
                        <p className="mt-3 mb-4 ml-24" style={{ textAlign: 'start' }}>
                            Conektto Design Studio empowers Product Managers to design APIs without the knowledge of
                            complex JSON or YAML coding. With Conektto, product managers are able to easily design APIs
                            in intuitive drag/drop interface, abstracting technical complexity and yet enabling seamless
                            collaboration with the API team including developers, testers, and ops.
                        </p>
                    </div>
                    <div className="flex flex-row items-center justify-center" align="center">
                        <p className="mt-3 mb-4 ml-24" style={{ textAlign: 'start' }}>
                            Conektto Test Studio is the industry is first API test lifecycle automation product that
                            uses NLP based technology to generate API mocks, tests, test data, test execution suite all
                            from a single source of OpenAPI specification.
                        </p>
                    </div>
                    <div className="border-t-2">
                        <div className="justify-center" align="center">
                            <p className="mt-3 mb-4" style={{ textAlign: 'start' }}>
                                For Further Documentation refer to the{' '}
                                <button className="button-collabmsg" onClick={navigateToDocs}>
                                    {' '}
                                    Docs{' '}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Dashboard>
    );
};
export default ConekttoDocs;
