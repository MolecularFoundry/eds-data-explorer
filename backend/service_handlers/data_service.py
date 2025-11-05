from operations import periodic_table_functions
from operations import data_functions

class DataService:
    def __init__(self, file_service, crucible_client):
        self.file_service = file_service
        self.crucible_client = crucible_client

    def get_emission_spectra(self, atomic_number: int):
        """
        Gets the emission spectra for a specific element.
        Args:
            atomic_number (int): Atomic number of the element
        Returns:
            dict: Dictionary containing emission spectra data
        """
        print(f"\n=== Starting get_emission_spectra() in DataService ===")
        return periodic_table_functions.get_emission_spectra(atomic_number)

    def get_zero_peak_width(self, filename, signal_idx):
        """
        Gets the zero peak width for a specific signal in a file.
        Args:
            filename (str): Name of the file to get zero peak width from
            signal_idx (int): Index of the signal to get zero peak width from
        Returns:
            dict: Dictionary containing zero peak width data
        """
        print(f"\n=== Starting get_zero_peak_width() in DataService ===")
        signal = self.file_service.get_or_load_file(filename, signal_idx)

        print(f"\n=== signal is {signal} in data_service.py ===")

        zero_index = data_functions.get_zero_index(signal)
        if zero_index is None:
            print(f"\n=== zero_index is None in data_service.py ===")
            return 0
            
        half_zero_height = data_functions.get_half_zero_height(signal, zero_index)
        if half_zero_height is None:
            print(f"\n=== half_zero_height is None in data_service.py ===")
            return 0

        spectrum_data = data_functions.get_spectrum_data(signal)
        if spectrum_data is None:
            print(f"\n=== spectrum_data is None in data_service.py ===")
            return 0

        fwhm_index = data_functions.get_fwhm_index(spectrum_data, half_zero_height, zero_index)
        if fwhm_index is None:
            print(f"\n=== fwhm_index is None in data_service.py ===")
            return 0

        axes_data = data_functions.load_axes_manager(signal)
        
        width_index = abs(fwhm_index - zero_index) 
        print(f"\n=== width_index is {width_index} in data_service.py ===")

        width_keV = (width_index * axes_data['scale'])
        print(f"\n=== width_keV is {width_keV} in data_service.py ===")
        
        return width_keV