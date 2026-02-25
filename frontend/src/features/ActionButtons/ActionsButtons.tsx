import React from 'react';
import { Button, IconButton } from '@chakra-ui/react';
import { IoSync } from 'react-icons/io5';
import { PiFileCsvDuotone } from 'react-icons/pi';
import { RiFileExcel2Line } from 'react-icons/ri';

interface ActionButtonsProps {
  onSync: () => void;
  onCsvDownload: () => void;
  onXlsxDownload: () => void;
  isSyncing: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onSync,
  onCsvDownload,
  onXlsxDownload,
  isSyncing
}) => {
  return (
    <div className="action-buttons">
      <IconButton
        aria-label="Синхронизировать"
        onClick={onSync}
        loading={isSyncing}
      >
        <IoSync />
      </IconButton>
      <Button onClick={onCsvDownload}>
        <PiFileCsvDuotone /> Скачать CSV
      </Button>
      <Button onClick={onXlsxDownload}>
        <RiFileExcel2Line /> Скачать Excel (.xlsx)
      </Button>
    </div>
  );
};

export default ActionButtons;