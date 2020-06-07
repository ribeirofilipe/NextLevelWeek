import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet';

import './styles.css';

import logo from '../../assets/logo.svg';

import api from '../../services/api';

import DropZone from '../../components/Dropzone';

interface Item {
  id: number;
  image_url: string;
  name: string;
}

interface IBGEUFResponse {
  sigla: string;
}

interface IBGECityResponse {
  nome: string;
}


const CreatePoint: React.FC = () => {
  const history = useHistory();

  const [items, setItems] = useState<Item[]>([]);
  const [ufs, setUfs] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  
  const [initialPosition, setinitialPosition] = useState<[number, number]>([0, 0]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: ''
  });

  const [selectedUf, setSelectedUf] = useState<string>('0');
  const [selectedCity, setSelectedCity] = useState<string>('0');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
  const [selectedFile, setSelectedFile] = useState<File>();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;

      setinitialPosition([ latitude, longitude ]);
    });
  }, []);

  useEffect(() => {
    api.get('items').then(response => {
      setItems(response.data);
    });
  }, []);

  useEffect(() => {
    axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
      .then(response => {
        const ufInitials = response.data.map(uf => uf.sigla);

        setUfs(ufInitials);
      })
  }, [])  

  useEffect(() => {
    if (selectedUf === '0') {
      setSelectedCity('0');
      return;
    };

    axios
    .get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
      .then(response => {
        const cityNames = response.data.map(city => city.nome);

        setCities(cityNames);
      })
  }, [selectedUf]);

  function handleSelectUf(event: ChangeEvent<HTMLSelectElement>) {
    const uf = event.target.value;

    setSelectedUf(uf);
  }

  function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
    const city = event.target.value;

    setSelectedCity(city);
  }

  function handleMapClick(event: LeafletMouseEvent) {
    setSelectedPosition([event.latlng.lat, event.latlng.lng]);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    })
  }

  function handleSelectItem(id: number) {
    selectedItems.includes(id) ?
      setSelectedItems([...selectedItems.filter(item => item !== id)]) :
      setSelectedItems([...selectedItems, id])
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const { name, email, whatsapp } = formData;
    const uf = selectedUf;
    const city = selectedCity;
    const [latitude, longitude] = selectedPosition;
    const items = selectedItems;

    const data = new FormData();

    data.append('name', name); 
    data.append('email', email); 
    data.append('whatsapp', whatsapp); 
    data.append('uf', uf); 
    data.append('city', city); 
    data.append('latitude', String(latitude)); 
    data.append('longitude', String(longitude)); 
    data.append('items', items.join(','));

    if (selectedFile) {
      data.append('image', selectedFile); 
    }
    
    await api.post('points', data);
    
    alert('Ponto de coleta criado.');

    history.push('/');
  }

  return (
    <div id="page-create-point">
      <header>
        <img src={logo} alt="Ecoleta" />
        <Link to="/">
          <FiArrowLeft />
          Voltar para home
        </Link>
      </header>

      <form onSubmit={handleSubmit}> 
        <h1>Cadastro do <br /> ponto de coleta.</h1>

        <DropZone onFileUploaded={setSelectedFile} />
        
        <fieldset>
          <legend>
            <h2>Dados</h2>
          </legend>

          <div className="field">
            <label htmlFor="name">Nome da entidade</label>
            <input 
              type="text"
              name="name"
              id="name"
              onChange={handleInputChange}
            />
          </div>

          <div className="field-group">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input 
                type="email"
                name="email"
                id="email"
                onChange={handleInputChange}
              />
            </div>
            <div className="field">
              <label htmlFor="whatsapp">Whatsapp</label>
              <input 
                type="text"
                name="whatsapp"
                id="whatsapp"
                onChange={handleInputChange}
              />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>Endereço</h2>
            <span>Selecione o endereço no mapa</span>
          </legend>

          <Map center={initialPosition} zoom={15} onclick={handleMapClick}>
            <TileLayer
              attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={selectedPosition} />
          </Map>

          <div className="field-group">
            <div className="field">
              <label htmlFor="uf">Estado (UF)</label>
              <select 
                onChange={handleSelectUf} 
                name="uf" 
                id="uf" 
                value={selectedUf}
              >
                <option value="0">Selecione uma UF</option>
                {ufs.map(uf => 
                  <option key={uf} value={uf}>{uf}</option>  
                )}
              </select>
            </div>

            <div className="field">
              <label htmlFor="city">Cidade</label>
              <select 
                onChange={handleSelectCity} 
                name="city" 
                id="city" 
                value={selectedCity}
              >
                <option value="0">Selecione uma cidade</option>
                {cities.map(city => 
                  <option key={city} value={city}>{city}</option>  
                )}
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>
            <h2>ítens de coleta</h2>
            <span>Selecione um ou mais itens abaixo</span>
          </legend>

          <ul className="items-grid">
            {items.map(item => 
              <li 
                className={selectedItems.includes(item.id) ? 'selected' : ''} 
                key={item.id} 
                onClick={() => handleSelectItem(item.id)}
              >
                <img src={item.image_url} alt={item.name} />
                <span>{item.name}</span>
              </li>
            )}
          </ul>
        </fieldset>

        <button type="submit">Cadastrar ponto de coleta</button>
      </form>
    </div>
  );
}

export default CreatePoint;