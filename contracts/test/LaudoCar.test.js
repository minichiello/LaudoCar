const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LaudoCar Contract", function () {
    let laudoCar;
    let owner;
    let vistoriador;

    beforeEach(async function () {
        [owner, vistoriador] = await ethers.getSigners();
        const LaudoCar = await ethers.getContractFactory("LaudoCar");
        laudoCar = await LaudoCar.deploy();
    });

    describe("Registro de Laudo", function () {
        it("Deve registrar um laudo com sucesso", async function () {
            const tx = await laudoCar.connect(vistoriador).registrarLaudo(
                "uuid-123e4567-e89b-12d3-a456-426614174000",
                "ABC1D23",
                "Toyota",
                "Corolla",
                2024,
                "QmPDF123abcdef...",
                ["QmFoto1...", "QmFoto2..."]
            );
            await tx.wait();

            const laudo = await laudoCar.laudos(1);
            expect(laudo.veiculo.placa).to.equal("ABC1D23");
            expect(laudo.veiculo.marca).to.equal("Toyota");
            expect(laudo.veiculo.modelo).to.equal("Corolla");
            expect(laudo.veiculo.ano).to.equal(2024);
            expect(laudo.ipfsPdfCID).to.equal("QmPDF123abcdef...");
            expect(laudo.vistoriador).to.equal(vistoriador.address);
            expect(laudo.id).to.equal(1);
        });

        it("Deve incrementar o ID corretamente", async function () {
            await laudoCar.registrarLaudo(
                "uuid-1",
                "AAA1111",
                "Honda",
                "Civic",
                2023,
                "QmPDF1",
                []
            );

            await laudoCar.registrarLaudo(
                "uuid-2",
                "BBB2222",
                "Ford",
                "Focus",
                2022,
                "QmPDF2",
                []
            );

            const laudo1 = await laudoCar.laudos(1);
            const laudo2 = await laudoCar.laudos(2);

            expect(laudo1.veiculo.placa).to.equal("AAA1111");
            expect(laudo2.veiculo.placa).to.equal("BBB2222");
        });

        it("Deve permitir até 5 fotos", async function () {
            const fotos = [
                "QmFoto1",
                "QmFoto2",
                "QmFoto3",
                "QmFoto4",
                "QmFoto5"
            ];

            const tx = await laudoCar.registrarLaudo(
                "uuid-3",
                "CCC3333",
                "Chevrolet",
                "Onix",
                2021,
                "QmPDF3",
                fotos
            );

            const receipt = await tx.wait();
            // Verifica que a transação foi bem-sucedida (não reverteu com "Maximo de 5 fotos permitido")
            expect(receipt).to.not.be.null;
            expect(receipt.status).to.equal(1); // 1 = sucesso
        });

        it("Deve reverter com mais de 5 fotos", async function () {
            const fotos = [
                "QmFoto1",
                "QmFoto2",
                "QmFoto3",
                "QmFoto4",
                "QmFoto5",
                "QmFoto6"
            ];

            await expect(
                laudoCar.registrarLaudo(
                    "uuid-4",
                    "DDD4444",
                    "Volkswagen",
                    "Gol",
                    2020,
                    "QmPDF4",
                    fotos
                )
            ).to.be.revertedWith("Maximo de 5 fotos permitido");
        });

        it("Deve reverter se placa estiver vazia", async function () {
            await expect(
                laudoCar.registrarLaudo(
                    "uuid-5",
                    "",
                    "Fiat",
                    "Uno",
                    2019,
                    "QmPDF5",
                    []
                )
            ).to.be.revertedWith("Placa invalida");
        });

        it("Deve reverter se CID do PDF estiver vazio", async function () {
            await expect(
                laudoCar.registrarLaudo(
                    "uuid-6",
                    "EEE5555",
                    "Renault",
                    "Sandero",
                    2018,
                    "",
                    []
                )
            ).to.be.revertedWith("CID do PDF invalido");
        });

        it("Deve emitir evento LaudoRegistrado", async function () {
            await expect(
                laudoCar.connect(vistoriador).registrarLaudo(
                    "uuid-7",
                    "FFF6666",
                    "Hyundai",
                    "HB20",
                    2017,
                    "QmPDF7",
                    ["QmFoto1"]
                )
            )
                .to.emit(laudoCar, "LaudoRegistrado")
                .withArgs(1, vistoriador.address, "FFF6666", "QmPDF7");
        });
    });

    describe("Busca por Placa", function () {
        it("Deve retornar array vazio se placa não existir", async function () {
            const ids = await laudoCar.obterLaudosPorPlaca("ZZZ9999");
            expect(ids.length).to.equal(0);
        });

        it("Deve retornar IDs dos laudos de uma placa", async function () {
            await laudoCar.registrarLaudo(
                "uuid-8",
                "GGG7777",
                "Jeep",
                "Renegade",
                2016,
                "QmPDF8",
                []
            );

            await laudoCar.registrarLaudo(
                "uuid-9",
                "GGG7777",
                "Jeep",
                "Renegade",
                2016,
                "QmPDF9",
                []
            );

            const ids = await laudoCar.obterLaudosPorPlaca("GGG7777");
            expect(ids.length).to.equal(2);
            expect(ids[0]).to.equal(1);
            expect(ids[1]).to.equal(2);
        });
    });
});
