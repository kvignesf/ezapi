import React from "react";
import CloseIcon from "@material-ui/icons/Close";

import AppIcon from "../shared/components/AppIcon";
import { PrimaryButton} from "../shared/components/AppButton";

const ErrorDrawer = ({ onClose, message, title }) => {
  return (
    <div
      className='flex flex-col'
      onClick={(e) => {
        e?.preventDefault();
        e?.stopPropagation();
      }}
    >
      <div className='flex flex-row p-4 justify-between border-b-1'>
        <p className='text-subtitle2'>{title}</p>
        <AppIcon
          onClick={(e) => {
            e?.preventDefault();
            e?.stopPropagation();

            onClose();
          }}
        >
          <CloseIcon />
        </AppIcon>
      </div>

      <div className='p-4'>
        <p className='text-overline2 mb-2'>
          {message}
        </p>
        
      </div>
      <div className="border-t-1 p-4 flex flex-row justify-end">
         <PrimaryButton
          onClick={(e) => {
            e?.preventDefault();
            e?.stopPropagation();

            onClose();
          }}
        >
          OK
        </PrimaryButton>
      </div>
    </div>
  );
};

export default ErrorDrawer;