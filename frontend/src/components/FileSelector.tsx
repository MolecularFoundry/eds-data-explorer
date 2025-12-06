import { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography } from '@mui/material';
import { getFiles } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import type { Dataset } from './Authentication/types';

interface FileSelectorProps {
  selectedFile: string;
  onFileSelect: (filename: string) => void;
}

const formatDatasetName = (dataset: Dataset) => {
  const date = dataset.creationTime 
    ? `(${dataset.creationTime.slice(0, 10)} ${dataset.creationTime.slice(11, 19)})` 
    : '';  // remove T and miliseconds 
  return `${dataset.datasetName} ${date}`
}

/**
 * FileSelector Component
 * 
 * Provides a dropdown menu for selecting files from the backend.
 * Handles fetching the file list and managing selection.
 * 
 * @param selectedFile - Currently selected file
 * @param onFileSelect - Callback function when a file is selected
 */
function FileSelector({ selectedFile, onFileSelect }: FileSelectorProps) {
  const [files, setFiles] = useState<Dataset[]>([]); // useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const { user } = useAuth()

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        var fileList: Dataset[] = []
        if (user && user.orcidId) {
          fileList = await getFiles(user.orcidId);  
          // fileList.map(file => {dsid: file[0], filename: file[1]})
        }
        setFiles(fileList)
        // setFiles(fileList.map(file => {dsid: file[0], filename: file[1]}));
        setError('');
      } catch (err) {
        setError(`Error fetching files: ${(err as Error).message}`);
        console.log(`${err}`);
      }
    };

    fetchFiles();
  }, [user]);

  const result = (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Box sx={{ 
        typography: 'h5', 
        mb: 2, 
        textAlign: 'center',
        color: 'text.primary',
        fontWeight: 'medium'
      }}>
        Select File
      </Box>
      <FormControl fullWidth error={!!error}>
        <InputLabel>Select File</InputLabel>
        <Select
          value={selectedFile}
          label="Select File"
          onChange={(e) => {
            onFileSelect(e.target.value);
          }}
        >
          {files.map((file) => (
            <MenuItem key={file.dsid} value={file.dsid}>
              {formatDatasetName(file)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {error && (
        <Typography color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
  
  return result;
}

export default FileSelector; 