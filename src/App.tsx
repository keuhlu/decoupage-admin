import React, { useState, useEffect } from 'react';
import { 
  Autocomplete, 
  TextField, 
  Typography, 
  Grid, 
  Paper, 
  Box, 
  Modal,
  Link, 
  IconButton, 
  Table, 
  TableHead,
  TableCell,
  TableRow,
  TableBody
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

const App: React.FC = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [communesData, setCommunesData] = useState<any[]>([]);
  const [addressOptions, setAddressOptions] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [regionsDepartments, setRegionsDepartments] = useState([]);

  useEffect(() => {
    const getRegionsDepartments = async () => {
      try {
        const response = await axios.get('https://geo.api.gouv.fr/regions');
        const regions = response.data;
        const regionsWithDepartments = [];

        for (const region of regions) {
          const regionCode = region.code;
          const departementsResponse = await axios.get(`https://geo.api.gouv.fr/regions/${regionCode}/departements`);
          const departements = departementsResponse.data;
          const regionWithDepartements = { ...region, departements };
          regionsWithDepartments.push(regionWithDepartements);
        }

        setRegionsDepartments(regionsWithDepartments);
      } catch (error) {
        console.error('Une erreur s\'est produite lors de la récupération des régions et des départements', error);
      }
    };
    
    getRegionsDepartments();
  }, []);

  const handleSearchChange = async (event: any, newValue: string) => {
    // Don't request the API if we have less than 3 characters
    if (newValue.length < 3) {
      return;
    }
    const response = await axios.get(`https://api-adresse.data.gouv.fr/search/?q=${newValue}`);
    setAddressOptions(response.data.features);    
  };

  const handleAddressChange = async (event: any, newValue: any | null) => {
    setAddress(newValue);
    if (newValue && newValue.properties && newValue.properties.citycode) {
      const depResponse = await axios.get(`https://geo.api.gouv.fr/departements/${newValue.properties.citycode.substring(0, 2)}/communes`);
      setCommunesData(depResponse.data);
    }    
  };

  const handleOpenModal = async (depCode: string) => {    
  
    // Check if we have a department code (from clicking on a department in the table)
    if (depCode) {
      const depResponse = await axios.get(`https://geo.api.gouv.fr/departements/${depCode}/communes`);
      setCommunesData(depResponse.data);
      setOpenModal(true);      
      return;
    }        
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    height: '100vh',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,    
    overflow: 'scroll'
  };

  return (
    <Paper>
      <Box className="GeoApiApp" sx={{ padding: '0.5rem', maxWidth: '1200px', margin: 'auto' }}>
        <Grid container item spacing={2} direction="column" xs={10} sx={{ padding: '0.5rem', maxWidth: '1200px', margin: 'auto' }}>
          <Grid item>
            <Autocomplete
              sx={{width: '100%'}}
              id="address-search"
              options={addressOptions}
              getOptionLabel={(option) => option.properties.label}
              onInputChange={handleSearchChange}
              onChange={handleAddressChange}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => <TextField {...params} label="Tapez ici une adresse ou une ville" />}
            />
          </Grid>

          {address && communesData && (
            <Grid item xs={12}>
              
              <Typography>Commune sélectionnée : {address?.properties?.city}</Typography>
              <Typography>Population : {address?.properties?.population}</Typography>
              <Typography>Type : {address?.properties?.type}</Typography>
              <Typography>Code ville : {address?.properties?.citycode}</Typography>
              <Typography>Département & Région : {address?.properties?.context}</Typography>
              <Link href="#" sx={{ display: 'block', marginTop: '20px' }}onClick={() => handleOpenModal(address?.properties?.citycode?.substring(0, 2))}>Consulter la liste des communes du département</Link>

              {/* Ici je voulais ajouter une map avec react-leflet et OpenStreetMap mais ça m'affichait du Picasso */}
              
            </Grid>
          )}          
          <Grid item xs={12}>
            <Typography sx={{textAlign: 'center', marginTop: '20px', marginBottom: '20px'}} variant="h5">Liste des Régions et des Départements</Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Région</TableCell>
                  <TableCell>Départements</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {regionsDepartments.map((region, index) => (
                  <>
                    {region.departements.map((dep, depIndex) => (
                      <TableRow key={depIndex}>
                        {depIndex === 0 && <TableCell rowSpan={region.departements.length}>{region.nom}</TableCell>}
                        <TableCell>
                          <Link href="#" onClick={() => handleOpenModal(dep.code)}>{dep.nom}</Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ))}
              </TableBody>
            </Table>
          </Grid>
        </Grid>
      </Box>
      <Modal
        open={openModal}
        onClose={handleCloseModal}                
      >
        <Box sx={modalStyle}>
          <IconButton onClick={handleCloseModal} sx={{position: 'absolute', right: '0', padding: '10px'}}>
            <CloseIcon />
          </IconButton>       
          <Table>                                         
            <TableHead>
              <TableRow>
                <TableCell>Commune</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Code EPCI</TableCell>
                <TableCell>Code Postal</TableCell>  
                <TableCell>Population</TableCell>                                          
                <TableCell>Siren</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {communesData.map((commune) => (
                <TableRow key={commune.code}>
                  <TableCell>{commune.nom}</TableCell>
                  <TableCell>{commune.code}</TableCell>
                  <TableCell>{commune.codeEpci}</TableCell>
                  <TableCell>{commune.codesPostaux.join(", ")}</TableCell>
                  <TableCell>{commune.population}</TableCell>
                  <TableCell>{commune.siren}</TableCell>
                </TableRow>
              ))}
            </TableBody>                  
        </Table>
        </Box>
      </Modal>
    </Paper>
  );
};

export default App;