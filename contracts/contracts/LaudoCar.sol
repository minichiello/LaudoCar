// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract LaudoCar is ReentrancyGuard {

    struct Veiculo {
        string uuid;
        string placa;
        string marca;
        string modelo;
        uint16 ano;
    }

    struct Laudo {
        uint256 id;
        address vistoriador;
        Veiculo veiculo;
        string ipfsPdfCID;
        string[] ipfsFotosCID;
        uint256 timestamp;
    }

    uint256 private _proximoId = 1;
    mapping(uint256 => Laudo) public laudos;
    mapping(string => uint256[]) private _laudosPorPlaca;

    event LaudoRegistrado(uint256 indexed id, address indexed vistoriador, string placa, string ipfsPdfCID);

    function registrarLaudo(
        string memory _uuid,
        string memory _placa,
        string memory _marca,
        string memory _modelo,
        uint16 _ano,
        string memory _ipfsPdfCID,
        string[] memory _ipfsFotosCID
    ) public nonReentrant returns (uint256) {
        require(bytes(_placa).length > 0, "Placa invalida");
        require(bytes(_ipfsPdfCID).length > 0, "CID do PDF invalido");
        require(_ipfsFotosCID.length <= 5, "Limite de 5 fotos no maximo");

        uint256 novoId = _proximoId;

        Veiculo memory novoVeiculo = Veiculo({
            uuid: _uuid,
            placa: _placa,
            marca: _marca,
            modelo: _modelo,
            ano: _ano
        });

        laudos[novoId] = Laudo({
            id: novoId,
            vistoriador: msg.sender,
            veiculo: novoVeiculo,
            ipfsPdfCID: _ipfsPdfCID,
            ipfsFotosCID: _ipfsFotosCID,
            timestamp: block.timestamp
        });

        _laudosPorPlaca[_placa].push(novoId);
        _proximoId++;

        emit LaudoRegistrado(novoId, msg.sender, _placa, _ipfsPdfCID);
        return novoId;
    }

    function obterLaudosPorPlaca(string memory _placa) public view returns (uint256[] memory) {
        return _laudosPorPlaca[_placa];
    }
}
