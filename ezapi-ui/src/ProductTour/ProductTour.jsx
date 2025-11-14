import { useState } from 'react';
import Dashboard from '../Dashboard';
import { PrimaryButton } from '../shared/components/AppButton';
import { useGetProductVideos } from './productTourQueries';

const ProductTour = () => {
    const url = `https://www.youtube.com/watch?v=DFsgbM8mRp8`;
    const [index, setIndex] = useState(0);
    const {
        data: productVideosData,
        isLoading: isFetchingOrders,
        error: fetchOrdersError,
        // isFetching: isFetchingOrdersBg,
        // refetch: refetchOrders,
    } = useGetProductVideos();

    const handleNext = () => {
        if (productVideosData?.productVideos) {
            setIndex((index + 1) % productVideosData?.productVideos.length);
        }
    };
    const handlePrev = () => {
        if (productVideosData?.productVideos && index > 0) {
            setIndex((index - 1) % productVideosData?.productVideos.length);
        }
    };
    //console.log("productVideos:", productVideosData);
    return (
        <Dashboard selectedIndex={4}>
            <div className="mt-16">
                <div className="mb-4" align="center">
                    <iframe
                        width="1000"
                        height="500"
                        src={productVideosData && productVideosData.productVideos[index].youtubeURL}
                        // src = {url}
                        frameborder="0"
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                        allowfullscreen
                    />
                    <div style={{ width: '1000px' }}>
                        <h6 className="mt-4" style={{ textAlign: 'start' }}>
                            {productVideosData && productVideosData.productVideos[index].title}
                        </h6>
                        <p className="mt-3 mb-2" style={{ textAlign: 'start' }}>
                            {productVideosData && productVideosData.productVideos[index].description}
                        </p>
                    </div>
                </div>
                <div className="border-t-2 flex flex-row items-center justify-center pt-4">
                    <PrimaryButton classes="mr-3" onClick={handlePrev}>
                        Prev
                    </PrimaryButton>
                    <PrimaryButton onClick={handleNext}>Next</PrimaryButton>
                </div>
            </div>
        </Dashboard>
    );
};
export default ProductTour;
