const EzapiFooter = () => {
    return (
        <footer
            className="flex w-full align-middle fixed bottom-0 text-sm bg-gray-200 py-3 px-6 text-gray-700"
            style={{ height: '5vh' }}
        >
            <p className="flex text-overline3 align-middle items-center self-center">
                © {new Date().getFullYear()} Conektto INC. All Rights Reserved.
            </p>
        </footer>
    );
};

export default EzapiFooter;
