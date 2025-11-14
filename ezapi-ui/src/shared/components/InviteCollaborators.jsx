import _ from 'lodash';
import ChipInput from 'material-ui-chip-input';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useRecoilState } from 'recoil';
import projectAtom from '../../AddProject/projectAtom';
import Colors from '../colors';
import Messages from '../messages';
import routes from '../routes';
import { isEmailValid } from '../utils';
import './collaborators.css';

const InviteCollaborators = ({ collaborators, addProjectMutation, handleChange, ...rest }) => {
    const [error, setError] = useState(null);
    // const [numberOfCollaborators, setNumberOfCollaborators] = useState(0);

    // const loggedInEmail = getEmailId();
    const [projectDetails, setProjectDetails] = useRecoilState(projectAtom);

    // const { data: pricing_data } = usePricingData();
    // const { data: userProfile_data } = useUserProfile();

    // useEffect(() => {
    //   if (pricing_data && userProfile_data) {
    //     if (userProfile_data["plan_name"] == null || userProfile_data["plan_name"] == "Basic") {
    //       setNumberOfCollaborators(2);
    //     } else {
    //       setNumberOfCollaborators(
    //         pricing_data["products"].filter(
    //           (item) => item["plan_name"] == userProfile_data["plan_name"]
    //         )[0]["no_of_collaborators"]
    //       );
    //     }
    //   }
    // }, [pricing_data, userProfile_data]);
    const history = useHistory();

    const navigateToPricing = () => {
        history.push(routes.pricing);
    };
    return (
        <div className="p-4" {...rest} style={{ height: '405px', width: '100%' }}>
            <p className="text-mediumLabel mb-2">Invite users to collaborate</p>

            <ChipInput
                defaultValue={collaborators}
                dataSource={collaborators}
                onChange={(emails) => {
                    const trimmedEmails = emails?.map((email) => email?.trim());

                    handleChange(trimmedEmails);
                }}
                onBeforeAdd={(email) => {
                    if (!email || _.isEmpty(email)) {
                        setError(null);
                        return false;
                    }
                    // else if (email === loggedInEmail) {
                    //   setError(null);
                    //   return false;
                    // }
                    if (projectDetails.collaborators.length > projectDetails.numberOfCollaborators - 1) {
                        setError('You have exhausted your collaborator limit, please ');
                        return false;
                    }

                    const result = isEmailValid(email?.trim());

                    if (result) {
                        setError(null);
                        return result;
                    } else {
                        setError(Messages.INVALID_EMAIL);
                    }
                }}
                chipLimit={2}
                blurBehavior="add"
                allowDuplicates={false}
                fullWidth
                disableUnderline
                color="primary"
                newChipKeys={[',', ' ']}
                style={{
                    border: `1px solid ${Colors.neutral.gray4}`,
                    borderRadius: '4px',
                    padding: '0.25rem 0.75rem',
                }}
                // disabled={addProjectMutation?.isSuccess}
            />

            {error && (
                <>
                    {' '}
                    <p className="text-overline2 text-accent-red mt-3">
                        {error}{' '}
                        <button className="button-collabmsg" onClick={navigateToPricing}>
                            {' '}
                            upgrade{' '}
                        </button>{' '}
                    </p>
                </>
            )}
        </div>
    );
};
//history.push(routes.pricing)
export default InviteCollaborators;
