using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeamTime.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddClientReportShares : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ClientReportShares",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClientId = table.Column<int>(type: "int", nullable: false),
                    TokenHash = table.Column<string>(type: "char(64)", unicode: false, fixedLength: true, maxLength: 64, nullable: false),
                    CreatedByMemberId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CreatedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    FromUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    ToUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    ExpiresAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    RevokedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClientReportShares", x => x.Id);
                    table.CheckConstraint("CK_ClientReportShares_ValidDateRange", "[FromUtc] IS NULL OR [ToUtc] IS NULL OR [ToUtc] > [FromUtc]");
                    table.CheckConstraint("CK_ClientReportShares_ValidExpiration", "[ExpiresAtUtc] IS NULL OR [ExpiresAtUtc] > [CreatedAtUtc]");
                    table.CheckConstraint("CK_ClientReportShares_ValidRevocation", "[RevokedAtUtc] IS NULL OR [RevokedAtUtc] >= [CreatedAtUtc]");
                    table.ForeignKey(
                        name: "FK_ClientReportShares_AspNetUsers_CreatedByMemberId",
                        column: x => x.CreatedByMemberId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ClientReportShares_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ClientReportShares_ClientId_CreatedAtUtc",
                table: "ClientReportShares",
                columns: new[] { "ClientId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_ClientReportShares_CreatedByMemberId",
                table: "ClientReportShares",
                column: "CreatedByMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_ClientReportShares_TokenHash",
                table: "ClientReportShares",
                column: "TokenHash",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ClientReportShares");
        }
    }
}
