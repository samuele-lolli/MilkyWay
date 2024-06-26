const SearchByLotNumber = ({ searchLotNumber, setSearchLotNumber, filteredSteps, setFilteredSteps, completedSteps }) => {

    const handleSearch = (event) => {
        const lotNumber = event.target.value;
        setSearchLotNumber(lotNumber);
        if (lotNumber) {
            const filtered = completedSteps.filter(step => String(step[6]) === lotNumber);
            setFilteredSteps(filtered);
        } else {
            setFilteredSteps([]);
        }
    };

    return (
        <div>
            <h2>Search by Lot Number</h2>
            <input
                type="text"
                value={searchLotNumber}
                onChange={handleSearch}
                placeholder="Inserisci il numero di lotto"
            />
            {searchLotNumber && (
                <div>
                    <h2>Search results for lot {searchLotNumber}</h2>
                    {filteredSteps.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    <th>Step</th>
                                    <th>Supervisor</th>
                                    <th>Status</th>
                                    <th>Start Time</th>
                                    <th>End Time</th>
                                    <th>Location</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSteps.map((step, index) => (
                                    <tr key={index}>
                                        <td>{step[0]}</td>
                                        <td>{step[1]}</td>
                                        <td>{step[2] ? 'Completed' : 'Pending'}</td>
                                        <td>{step[3] !== '0' ? new Date(parseInt(step[3]) * 1000).toLocaleString() : '-'}</td>
                                        <td>{step[4] !== '0' ? new Date(parseInt(step[4]) * 1000).toLocaleString() : '-'}</td>
                                        <td>{step[5]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>No results found for the lot {searchLotNumber}</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchByLotNumber;