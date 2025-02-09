import path from "path";
import { fileURLToPath } from "url";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    entry: {
        main: "./src/index.mjs",
        view: "./src/view.mjs"
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].bundle.js", // [name] wird durch main/admin ersetzt
        publicPath: "/"  // 🔥 Stellt sicher, dass die JS-Dateien absolut referenziert werden

    },

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"]
                    }
                }
            },

            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, "css-loader"]
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    // Creates `style` nodes from JS strings
                    "style-loader",
                    // Translates CSS into CommonJS
                    "css-loader",
                    // Compiles Sass to CSS
                    "sass-loader",
                ],
            },
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "./public/index.html",
            filename: "index.html",
            chunks: ["main"]  // Nur `main.js` einbinden
        }),
        new HtmlWebpackPlugin({
            template: "./public/view.html",
            filename: "view.html",
            chunks: ["view"]  // Nur `main.js` einbinden
        }),
        new MiniCssExtractPlugin({ filename: "styles.css" }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
                    to: "pdf.worker.min.mjs"
                }
            ]
        })
    ],
    devServer: {
        static: path.resolve(__dirname, "dist"),
        port: 8080,
        hot: true
    },
    mode: "development"
};
