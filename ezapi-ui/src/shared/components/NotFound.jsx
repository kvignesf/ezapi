import Card from '@material-ui/core/Card';
import { Link } from 'react-router-dom';
import routes from '../routes';

const NotFound = () => (
    <>
        <div className="h-screen flex justify-center items-center">
            <Card className="w-1/2 flex flex-col p-5 items-center">
                <h1 className="text-center">404</h1>
                <h3 className="text-center mb-6">Seems like this page doesn't exist</h3>
                <Link to={routes.root} className="text-neutral-gray3">
                    Go Home
                </Link>
            </Card>
        </div>
    </>
);

export default NotFound;
