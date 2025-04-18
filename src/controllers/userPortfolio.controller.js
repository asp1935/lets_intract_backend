import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { APIResponse } from "../utils/APIResponse.js";
import { User } from "../models/user.model.js";
import { UserPortfolio } from "../models/userPortfolio.model.js";
import crypto from 'crypto';
import fs from 'fs';
import { promises as fsp } from 'fs'
import path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const randomno = () => crypto.randomInt(0, 999).toString();
const genrateUsername = (name) => {
    return (name.split(' ').join('_') + randomno()).toLowerCase();
}

const createUserPortfolio = asyncHandler(async (req, res) => {
    try {
        const { userId, name, ownerName, about, email, mobile, address, theme, socialLinks } = req.body;

        const profilePhotoUrl = req.file?.path ? `/public/portfolio/${userId}/${req.file?.filename}` : "";
        if (!profilePhotoUrl) {
            return res.status(400).json(new APIResponse(400, {}, "Profile Photo is Required"));
        }
        let links = {};
        if (req.body.socialLinks) {
            try {
                links = JSON.parse(req.body.socialLinks);
            } catch (err) {
                return res.status(400).json(new APIResponse(400, {}, "Invalid format for socialLinks"));
            }
        }
        if ([userId, name, ownerName, about, email, address, theme].some(field => String(field || '').trim() === '')) {
            fs.unlinkSync(req.file?.path);
            return res.status(400).json(new APIResponse(400, {}, 'All Fields Are Required'));
        }

        if (!/^\d{10}$/.test(mobile)) {
            fs.unlinkSync(req.file?.path);
            return res.status(400).json(new APIResponse(400, {}, 'Invalid Mobile No'));
        }


        if (!isValidObjectId(userId)) {
            fs.unlinkSync(req.file?.path);
            return res.status(400).json(new APIResponse(400, {}, 'Invalid User ID'));
        }


        const user = await User.findById(userId);
        if (!user) {
            fs.unlinkSync(req.file?.path);
            return res.status(404).json(new APIResponse(404, {}, 'User Not Found'));
        }

        const existingPortfolio = await UserPortfolio.findOne({ userId });
        if (existingPortfolio) {
            fs.unlinkSync(req.file?.path);
            return res.status(409).json(new APIResponse(409, {}, 'User Portfolio Already Exists'));
        }

        const userName = genrateUsername(name);

        //  Use upsert to insert if not exists, otherwise update
        const portfolio = await UserPortfolio.create(
            {
                userId, userName, name, ownerName, about, email, mobile, address, theme, profilePhotoUrl, socialLinks: links
            },
        );

        return res.status(200).json(new APIResponse(200, portfolio, "Portfolio Created  Successfully"));
    } catch (error) {
        console.error(error);
        fs.unlinkSync(req.file?.path);
        return res.status(500).json(new APIResponse(500, {}, 'Internal Server Error'));
    }
});

const updateUserPortfolio = asyncHandler(async (req, res) => {
    try {
        const portfolioId = req.params.id;
        if (!portfolioId || !isValidObjectId(portfolioId)) {
            return res.status(400).json(new APIResponse(400, {}, "Invalid Portfolio ID"));
        }

        const { userName, name, ownerName, about, email, mobile, address, theme, socialLinks } = req.body;

        if ([userName, name, ownerName, about, email, address, theme].some(field => field?.trim() === '')) {
            return res.status(400).json(new APIResponse(400, {}, 'All Fields Are Required'));
        }

        if (!/^\d{10}$/.test(mobile)) {
            return res.status(400).json(new APIResponse(400, {}, 'Invalid Mobile No'));
        }

        // ✅ Exclude current portfolio while checking username
        const existsUserName = await UserPortfolio.findOne({
            userName: userName.toLowerCase(),
            _id: { $ne: portfolioId } // Exclude current portfolio
        });

        if (existsUserName) {
            return res.status(409).json(new APIResponse(409, {}, "Username Already Used By Someone"));
        }

        // ✅ Corrected `findByIdAndUpdate` (Pass only ID)
        const portfolio = await UserPortfolio.findByIdAndUpdate(
            portfolioId,
            {
                userName: userName.toLowerCase(),
                name, ownerName, about, email, mobile, address, theme, socialLinks
            },
            { new: true }
        );

        if (!portfolio) {
            return res.status(404).json(new APIResponse(404, {}, "Portfolio Not Found"));
        }

        return res.status(200).json(new APIResponse(200, portfolio, "Portfolio Updated Successfully"));
    } catch (error) {
        console.error(error);
        return res.status(500).json(new APIResponse(500, {}, 'Internal Server Error'));
    }
});

const updateUserProfile = asyncHandler(async (req, res) => {
    try {
        const pid = req.params.pid;
        const { userId } = req.body

        if (!pid || !isValidObjectId(pid)) {
            return res.status(400).json(new APIResponse(400, {}, "Invalid Portfolio Id"))
        }

        const portfolio = await UserPortfolio.findById(pid);

        if (!portfolio) {
            return res.status(404).json(new APIResponse(404, {}, 'Portfolio Not Found'))
        }

        const newProfilePhotoUrl = req.file?.path ? `/public/portfolio/${userId}/${req.file?.filename}` : "";
        if (!newProfilePhotoUrl) {
            return res.status(400).json(new APIResponse(400, {}, "Profile Photo is Required"));
        }
        // Delete file if it exists
        if (portfolio.profilePhotoUrl) {
            const filePath = path.join(__dirname, "..", "..", portfolio.profilePhotoUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        portfolio.profilePhotoUrl = newProfilePhotoUrl;
        portfolio.save();

        return res.status(200).json(new APIResponse(200, portfolio, "Profile Picture Updated Successfully"));

    } catch (error) {
        return res.status(500).json(new APIResponse(500, {}, "Internal Server Error"));

    }
})


const addPortfolioServices = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const { services } = req.body;
        if (!id || !isValidObjectId(id)) {
            return res.status(400).json(new APIResponse(400, {}, "Invalid ID"))
        }

        // Validate services (ensure it's an array of objects with title and description)
        let formattedServices = [];
        if (Array.isArray(services)) {
            formattedServices = services.map(service => ({
                title: service.title?.trim() || "",
                description: service.description?.trim() || ""
            })).filter(service => service.title !== "" && service.description !== "");
        } else {
            return res.status(400).json(new APIResponse(400, {}, 'Services Not in Required Format'))

        }

        const portfolio = await UserPortfolio.findByIdAndUpdate(id, {
            $push: { services: formattedServices }
        }, { new: true })

        return res.status(200).json(new APIResponse(200, portfolio, "Services Added Successfully"))

    } catch (error) {
        return res.status(500).json(new APIResponse(500, {}, "Internal Server Error"));
    }
});

const addPortfolioClient = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const clients = JSON.parse(req.body.clients); // Convert string to array

        if (!id || !isValidObjectId(id)) {
            return res.status(400).json(new APIResponse(400, {}, "Invalid ID"))
        }
        const portfolio = await UserPortfolio.findById(id);
        if (!portfolio) {
            return res.status(404).json(new APIResponse(404, {}, "Portfolio Not Created Yet"))
        }

        if (!Array.isArray(clients) || clients.length === 0) {
            return res.status(400).json(new APIResponse(400, {}, "All Clients array is required"));
        }


        // Ensure req.files is used for multiple uploads
        if (!req.files || req.files.length === 0) {
            return res.status(400).json(new APIResponse(400, {}, "All Client logos are required"));
        }

        if (clients.length !== req.files.length) {
            return res.status(400).json(new APIResponse(400, {}, "All Client Name & Logo Required"))
        }

        // Map uploaded files to clients
        // const clientObjs = clients.map((client, index) => {
        //     if (!client.name || client.name.trim() === '') {
        //         throw new Error(`Client at index ${index} is missing a name`);
        //     }
        //     return {
        //         name: client.name,
        //         logoUrl: `/public/portfolio/${portfolio?.userId}/${req.files[index]?.filename}`
        //     };
        // });
        let formattedClients = [];

        if (Array.isArray(clients)) {
            formattedClients = clients.map((client, index) => ({
                name: client.name?.trim() || "",
                logoUrl: req.files[index]?.filename ? `/public/portfolio/${portfolio?.userId}/${req.files[index]?.filename}` : ''
            })).filter(client => client.name !== "" || client.logoUrl !== "");
        } else {
            return res.status(400).json(new APIResponse(400, {}, 'Client Details Not in Required Format'))

        }
        // Add new clients to the portfolio
        portfolio.clients.push(...formattedClients);
        await portfolio.save();

        return res.status(200).json(new APIResponse(200, portfolio, "Client Added Successfully"))

    } catch (error) {
        return res.status(500).json(new APIResponse(500, {}, 'Internal Server Error'));
    }
});

const addPortfolioGallery = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;
        const gallery = JSON.parse(req.body.gallery);

        if (!id || !isValidObjectId(id)) {
            return res.status(400).json(new APIResponse(400, {}, "Invalid ID"));
        }

        const portfolio = await UserPortfolio.findById(id);
        if (!portfolio) {
            return res.status(404).json(new APIResponse(404, {}, "Portfolio Not Created Yet"));
        }

        if (!Array.isArray(gallery) || gallery.length === 0) {
            return res.status(400).json(new APIResponse(400, {}, "Gallery array is required"));
        }

        if (!req.files || req.files.length !== gallery.length) {
            return res.status(400).json(new APIResponse(400, {}, "Number of uploaded files must match the number of gallery items"));
        }

        const galleryItems = gallery.map((item, index) => {
            const type = item.type;
            const title = item.title?.trim() || "";
            const url = req.files[index]?.filename
                ? `/public/portfolio/${portfolio?.userId}/${req.files[index]?.filename}`
                : "";


            if (!["img", "video"].includes(type)) {
                return null
            }
            if (!title) {
                return null
            }

            return { type, url, title };
        }).filter(Boolean)

        if (galleryItems.length === 0) {
            return res.status(400).json(new APIResponse(400, {}, "Valid gallery data is required"));
        }

        const updatedPortfolio = await UserPortfolio.findByIdAndUpdate(id, {
            $push: { gallery: { $each: galleryItems } }
        }, { new: true });

        return res.status(200).json(new APIResponse(200, updatedPortfolio, "Gallery Items Added Successfully"));
    } catch (error) {
        return res.status(500).json(new APIResponse(500, {}, "Internal Server Error"));
    }
});

const deletePortfolioItem = asyncHandler(async (req, res) => {
    try {
        const { id, itemId, type } = req.query; // Portfolio ID, Item ID, Type

        if (!isValidObjectId(id) || !isValidObjectId(itemId)) {
            return res.status(400).json(new APIResponse(400, {}, "Invalid Portfolio ID or Item ID"));
        }

        const validTypes = ["gallery", "services", "clients"];
        if (!validTypes.includes(type)) {
            return res.status(400).json(new APIResponse(400, {}, "Invalid Type. Use 'gallery', 'services', or 'clients'"));
        }

        // Find the portfolio
        const portfolio = await UserPortfolio.findById(id);
        if (!portfolio) {
            return res.status(404).json(new APIResponse(404, {}, "Portfolio Not Found"));
        }

        // Find the item to delete
        const item = portfolio[type].find(entry => entry._id.toString() === itemId);
        if (!item) {
            return res.status(404).json(new APIResponse(404, {}, "Item Not Found"));
        }

        // Delete file if it exists
        if (item.url || item.logoUrl) {
            const filePath = path.join(__dirname, "..", "..", item.url || item.logoUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Remove the item from the array using `$pull`
        const updatedPortfolio = await UserPortfolio.findByIdAndUpdate(id, {
            $pull: { [type]: { _id: itemId } }
        }, { new: true });

        return res.status(200).json(new APIResponse(200, updatedPortfolio, `${type} Item Deleted Successfully`));

    } catch (error) {
        console.error(error);
        return res.status(500).json(new APIResponse(500, {}, "Internal Server Error"));
    }
});

const getPortfolio = asyncHandler(async (req, res) => {
    try {
        const { id, userId, userName } = req.query;
        if (id || userId || userName) {
            const portfolio = await UserPortfolio.findOne({
                $or: [{ userName }, { _id: id }, { userId }]
            })

            if (!portfolio) {
                return res.status(404).json(new APIResponse(404, {}, "No Portfolio Found"))
            }
            return res.status(200).json(new APIResponse(200, portfolio, 'Portfolio Fetched'))
        }
        else {
            const portfolios = await UserPortfolio.find();
            if (!portfolios || portfolios.length === 0) {
                return res.status(200).json(new APIResponse(200, {}, "No Portfolio Available"));
            }
            return res.status(200).json(new APIResponse(200, portfolios, "Portfolio Fetched Successfully"));
        }
    } catch (error) {
        return res.status(500).json(new APIResponse(500, {}, "Internal Server Error"));
    }
})

const getUserPortfolio = asyncHandler(async (req, res) => {
    try {
        const { userName } = req.params;

        const portfolio = await UserPortfolio.findOne({ userName })

        if (!portfolio) {
            return res.status(404).json(new APIResponse(404, {}, "No Portfolio Found"))
        }
        return res.status(200).json(new APIResponse(200, portfolio, 'Portfolio Fetched'))
    } catch (error) {
        return res.status(500).json(new APIResponse(500, {}, "Internal Server Error"));
    }
});

const deletePortfolio = asyncHandler(async (req, res) => {
    try {
        const portfolioId = req.params.pid;

        if (!portfolioId || !isValidObjectId(portfolioId)) {
            return res.status(400).json(new APIResponse(400, {}, "Invalid Portfolio Id"))
        }
        const portfolio = await UserPortfolio.findById(portfolioId);
        if (!portfolio) {
            return res.status(404).json(new APIResponse(404, {}, 'Portfolio Already Deleted'))
        }
        const folderPath = path.join(__dirname, '..', '..', 'public', 'portfolio', (portfolio.userId).toString())

        try {
            // Check if folder exists
            await fsp.access(folderPath);
            // If no error, folder exists — delete it
            await fsp.rm(folderPath, { recursive: true, force: true });
        } catch (err) {
            if (err.code === 'ENOENT') {
                return res.status(500).json(new APIResponse(500, {}, 'Internal Server Error'))

            } else {
                return res.status(500).json(new APIResponse(500, {}, 'Internal Server Error'))

            }
        }
        await UserPortfolio.findByIdAndDelete(portfolioId)
        return res.status(200).json(new APIResponse(200, {}, "Portfolio Deleted Successfully"))

    } catch (error) {
        return res.status(500).json(new APIResponse(500, {}, 'Internal Server Error'))
    }
});


export {
    createUserPortfolio,
    updateUserPortfolio,
    updateUserProfile,
    addPortfolioServices,
    addPortfolioClient,
    addPortfolioGallery,
    deletePortfolioItem,
    getPortfolio,
    getUserPortfolio,
    deletePortfolio
}
