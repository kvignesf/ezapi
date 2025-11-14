import _ from 'lodash';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useRecoilState } from 'recoil';
import schemaAtom from '../../../shared/atom/schemaAtom';
import LoaderWithMessage from '../../../shared/components/LoaderWithMessage';
import { isArray, isFullMatch, isNoMatch, isObject, isPartialMatch, isSchema } from '../../../shared/utils';
import FullMatch from './FullMatch';
import NoMatch from './NoMatch';
import PartialMatch from './PartialMatch';
import { useGetAllSchemas, useGetSubSchema } from './schemaQueries';

const Schema = () => {
    const { projectId } = useParams();
    const [schemaState, setSchemaState] = useRecoilState(schemaAtom);
    const [schemaData, setSchemaData] = useState(null);

    const { isLoading, error: getAllSchemasError, data: allSchemaData, mutate: getAllSchemas } = useGetAllSchemas();
    const {
        isLoading: isLoadingSubSchema,
        error: getSubSchemasError,
        data: subSchemaData,
        mutate: getSubSchema,
        reset: resetSubSchemaData,
        isIdle: isGetSubSchemaIdle,
    } = useGetSubSchema();

    useEffect(() => {
        if (!schemaState.selected || _.isEmpty(schemaState.selected)) {
            resetSubSchemaData();
            getAllSchemas({ projectId });
        } else {
            const selectedSchema = _.last(schemaState?.selected);

            if (!_.isEmpty(selectedSchema?.data)) {
                const clonedData = _.cloneDeep(selectedSchema?.data);

                setSchemaData(clonedData);
            } else {
                if (!isLoadingSubSchema && !selectedSchema?.is_child) {
                    getSubSchema({
                        projectId,
                        name: selectedSchema?.name,
                        type: selectedSchema?.type,
                        ref: selectedSchema?.ref,
                    });
                }
            }
        }
    }, [schemaState.selected]);

    useEffect(() => {
        if (subSchemaData) {
            if (subSchemaData?.nSchemaArray && !_.isEmpty(subSchemaData?.nSchemaArray)) {
                setSchemaData(subSchemaData?.nSchemaArray);
            } else if (subSchemaData?.data && !_.isEmpty(subSchemaData?.data)) {
                setSchemaData(subSchemaData?.data);
            }
            return;
        }
        setSchemaData(allSchemaData?.nSchemaArray);
    }, [allSchemaData, subSchemaData]);

    const getFullMatchItems = () => {
        return _.filter(schemaData, (schema) => isFullMatch(schema));
    };

    const getPartialMatchItems = () => {
        return _.filter(schemaData, (schema) => isPartialMatch(schema));
    };

    const getNoMatchItems = () => {
        return _.filter(schemaData, (schema) => isNoMatch(schema));
    };

    const onItemClick = (ref) => {
        if (isSchema(ref) || isArray(ref) || isObject(ref)) {
            if (!ref?.is_child) {
                const updatedSchemaState = _.cloneDeep(schemaState);

                if (!updatedSchemaState?.selected || _.isEmpty(updatedSchemaState?.selected)) {
                    updatedSchemaState.selected = [];
                }

                updatedSchemaState?.selected?.push(ref);

                setSchemaState(updatedSchemaState);
            }
        }
    };

    if (isLoading || isLoadingSubSchema) {
        return <LoaderWithMessage message="Loading schemas" className="h-full" contained />;
    }

    return (
        <div className="mx-4 py-4">
            <div className="flex flex-row gap-x-5 justify-center">
                <div className="flex-1 h-fit bg-neutral-gray7 rounded-md p-2">
                    <FullMatch items={getFullMatchItems()} onItemClick={onItemClick} />
                </div>

                <div className="flex-1 h-fit bg-neutral-gray7 rounded-md p-2 ">
                    <PartialMatch items={getPartialMatchItems()} onItemClick={onItemClick} />
                </div>

                <div className="flex-1 h-fit  bg-neutral-gray7 rounded-md p-2">
                    <NoMatch items={getNoMatchItems()} onItemClick={onItemClick} />
                </div>
            </div>
        </div>
    );
};

export default Schema;
